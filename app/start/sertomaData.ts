/**
 * sertomaData — health of sertoma-server (homelab microk8s) for the
 * start page's systems panel.
 *
 * Reads the in-cluster sentinel agent exposed through a Cloudflare
 * Tunnel at SERTOMA_STATUS_URL (a tokenized URL — the token is part of
 * the path, stored as an env var, never committed):
 *
 *   https://sertoma.cobos.io/status/<token>
 *
 * → { ok, generatedAt, namespaces: { enkiflow: {pods, ready, restarting,
 *      failing: [{ns, pod, reason}]}, … }, failing: […] }
 *
 * The namespace→project mapping lives in the frontend (page.tsx) so it
 * can change without touching the cluster.
 *
 * Every failure mode degrades silently to null: the panel falls back to
 * "sin señal" and the plain HEAD-ping row keeps working on its own.
 */

export type SentinelFailing = {
  ns: string;
  pod: string;
  reason: string;
  /** restartCount of the worst container in the pod at snapshot time */
  restarts?: number;
};

export type NamespaceHealth = {
  pods: number;
  ready: number;
  restarting: number;
  failing: SentinelFailing[];
};

export type SertomaStatus = {
  generatedAt: string;
  /** true when every watched workload is healthy */
  ok: boolean;
  namespaces: Record<string, NamespaceHealth>;
  /** aggregated convenience list */
  failing: SentinelFailing[];
  /** namespaces excluded from readiness by the agent (e.g. arc-runners) */
  ignored?: string[];
};

export async function getSertomaStatus(): Promise<SertomaStatus | null> {
  const url = process.env.SERTOMA_STATUS_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<SertomaStatus>;
    if (!data || typeof data !== "object" || !data.namespaces) return null;
    return {
      generatedAt: data.generatedAt ?? "",
      ok: Boolean(data.ok),
      namespaces: data.namespaces,
      failing: Array.isArray(data.failing) ? data.failing : [],
    };
  } catch {
    return null;
  }
}

/** Human reason for a pod failure, trimmed for one console line. */
export function shortReason(reason: string): string {
  // "CrashLoopBackOff (web)" → keep the k8s verb, drop container noise if long
  return reason.length > 34 ? `${reason.slice(0, 31)}…` : reason;
}
