/**
 * sentinel.js — health agent for sertoma-server (microk8s).
 *
 * Watches every pod in the cluster (RBAC: read-only) and serves:
 *   GET /healthz        → 200 always while this process lives.
 *                         UptimeRobot monitor #1 = "cluster reachable".
 *   GET /ready          → 200 if no failing pods outside IGNORE_READY_NS,
 *                         else 503 + the failing list. UptimeRobot
 *                         monitor #2 = "a workload is broken".
 *   GET /status/<token> → full per-namespace JSON for start.cobos.io.
 *                         Token-checked (timing-safe), 403 otherwise.
 *
 * A pod is FAILING when any of:
 *   - phase Failed (e.g. Evicted)
 *   - a container waiting in CrashLoopBackOff / ImagePullBackOff / …
 *   - last termination was OOMKilled with restarts > 0
 *   - Running but not Ready ("se colgó": readiness probe failing)
 *   - Pending or Init stuck longer than PENDING_GRACE_MS
 *
 * Completed Jobs (phase Succeeded) never count — they are finished work.
 * Namespaces in IGNORE_READY_NS (default arc-runners: GitHub Actions
 * runners churn by design) still show up in /status but never trip /ready,
 * so CI churn can't paint the page red.
 */
const http = require("http");
const https = require("https");
const fs = require("fs");

const PORT = Number(process.env.PORT || 8080);
const POLL_MS = 15_000;
const PENDING_GRACE_MS = 10 * 60_000;
const IGNORE_READY = new Set(
  (process.env.IGNORE_READY_NS || "arc-runners")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);
const STATUS_TOKEN = process.env.STATUS_TOKEN || "";
const KUBE_API = process.env.KUBE_API || "https://kubernetes.default.svc";
const TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";
const CACERT_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

/** Waiting reasons that mean a container is genuinely broken. */
const BAD_WAITING = new Set([
  "CrashLoopBackOff",
  "ImagePullBackOff",
  "ErrImagePull",
  "CreateContainerConfigError",
  "CreateContainerError",
  "InvalidImageName",
  "RunContainerError",
]);

let cache = { generatedAt: null, namespaces: {}, failing: [] };
let lastError = null;

function timingSafeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
    return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function apiGet(path) {
  // https module (not fetch): the in-cluster API uses the cluster's own CA
  // (self-signed), so the request must trust the mounted ca.crt explicitly.
  const token = fs.readFileSync(TOKEN_PATH, "utf8").trim();
  const ca = fs.readFileSync(CACERT_PATH);
  return new Promise((resolve, reject) => {
    const req = https.request(
      `${KUBE_API}${path}`,
      {
        method: "GET",
        ca,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10_000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200)
            reject(new Error(`GET ${path} → ${res.statusCode}`));
          else resolve(JSON.parse(data));
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

function ageMs(pod) {
  return Date.now() - new Date(pod.metadata.creationTimestamp).getTime();
}

/** Returns a failure reason string, or null if the container looks fine. */
function containerProblem(cs) {
  const w = cs.state?.waiting?.reason;
  if (w && BAD_WAITING.has(w)) return `${w} (${cs.name})`;
  // Already crashed but not yet in backoff: terminated non-zero counts too
  // (Completed is the normal exit — never flagged).
  const t = cs.state?.terminated;
  if (t && t.exitCode !== 0 && t.reason !== "Completed")
    return `exit ${t.exitCode} (${cs.name})`;
  if (cs.lastState?.terminated?.reason === "OOMKilled" && cs.restartCount > 0)
    return `OOMKilled (${cs.name})`;
  if (!cs.ready && cs.state?.running) return `notReady (${cs.name})`;
  return null;
}

function analyzePods(items) {
  const namespaces = {};
  const failing = [];
  for (const pod of items) {
    const ns = pod.metadata.namespace;
    const name = pod.metadata.name;
    if (!namespaces[ns])
      namespaces[ns] = { pods: 0, ready: 0, restarting: 0, failing: [] };
    const agg = namespaces[ns];

    const phase = pod.status.phase;
    if (phase === "Succeeded") continue; // finished job, not live workload
    agg.pods++;

    let problem = null;

    if (phase === "Failed") {
      problem = pod.status.reason || "Failed";
    } else if (
      phase === "Pending" &&
      ageMs(pod) > PENDING_GRACE_MS
    ) {
      problem = `Pending ${Math.round(ageMs(pod) / 60000)}m`;
    }

    if (!problem) {
      for (const cs of pod.status.containerStatuses ?? []) {
        problem = containerProblem(cs);
        if (problem) break;
      }
    }
    if (!problem && phase === "Pending") {
      // Init containers mid-flight are normal; only stuck init fails.
      for (const cs of pod.status.initContainerStatuses ?? []) {
        const w = cs.state?.waiting?.reason;
        if (w && BAD_WAITING.has(w)) {
          problem = `init ${w} (${cs.name})`;
          break;
        }
      }
      if (!problem && ageMs(pod) > PENDING_GRACE_MS) {
        const init = (pod.status.initContainerStatuses ?? []).every(
          (cs) => cs.state?.terminated
        );
        if (!init) problem = "init stuck";
      }
    }

    const allReady =
      phase === "Running" &&
      (pod.status.containerStatuses ?? []).length > 0 &&
      (pod.status.containerStatuses ?? []).every((cs) => cs.ready);
    if (allReady) agg.ready++;
    for (const cs of pod.status.containerStatuses ?? [])
      agg.restarting += cs.restartCount || 0;

    if (problem) {
      const entry = { ns, pod: name, reason: problem };
      agg.failing.push(entry);
      failing.push(entry);
    }
  }
  return { generatedAt: new Date().toISOString(), namespaces, failing };
}

async function poll() {
  try {
    const list = await apiGet("/api/v1/pods");
    cache = analyzePods(list.items ?? []);
    lastError = null;
  } catch (err) {
    lastError = String(err?.message || err);
    console.error("[poll]", err?.cause?.code || "", err?.message || err);
    // keep serving the previous snapshot; /healthz stays honest via lastError
  }
}

function send(res, code, body) {
  // HEAD requests (UptimeRobot's default probe) get routing + status but
  // no payload — a 405 here would read as "down" to the monitors.
  const isHead = res.req?.method === "HEAD";
  res.writeHead(code, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(isHead ? undefined : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const method = req.method === "HEAD" ? "GET" : req.method;
  try {
    if (method !== "GET") return send(res, 405, { ok: false });

    if (url.pathname === "/healthz") {
      return send(res, 200, {
        ok: true,
        generatedAt: cache.generatedAt,
        pollError: lastError,
      });
    }

    if (url.pathname === "/ready") {
      const bad = cache.failing.filter((f) => !IGNORE_READY.has(f.ns));
      return send(res, bad.length ? 503 : 200, {
        ok: bad.length === 0,
        failing: bad,
      });
    }

    const m = url.pathname.match(/^\/status\/([^/]+)$/);
    if (m) {
      if (!STATUS_TOKEN || !timingSafeEq(m[1], STATUS_TOKEN))
        return send(res, 403, { ok: false });
      const bad = cache.failing.filter((f) => !IGNORE_READY.has(f.ns));
      return send(res, 200, {
        ok: bad.length === 0 && !lastError,
        generatedAt: cache.generatedAt,
        pollError: lastError,
        namespaces: cache.namespaces,
        failing: cache.failing,
      });
    }

    send(res, 404, { ok: false });
  } catch (err) {
    send(res, 500, { ok: false, error: String(err?.message || err) });
  }
});

poll();
setInterval(poll, POLL_MS);
server.listen(PORT, () =>
  console.log(`sentinel listening on :${PORT} at ${new Date().toISOString()}`)
);
