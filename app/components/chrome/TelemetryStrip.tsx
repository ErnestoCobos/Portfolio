"use client";

import { useEffect, useState } from "react";
import { getLatestCommit, getSpaceData } from "../../lib/live-data";
import type { LatestCommit, SpaceData } from "../../lib/live-data";
import { useMounted } from "../portfolio-visuals";

function relAge(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "<1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * TelemetryStrip — live control-plane line under the hero boot log:
 * space telemetry + this repo's own last commit. Server and first client
 * render both show "···" placeholders (hydration-safe); values fill in
 * after mount. Failures keep the static fallbacks baked into live-data.
 */
export function TelemetryStrip({ mobile }: { mobile: boolean }) {
  const mounted = useMounted();
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [commit, setCommit] = useState<LatestCommit | null>(null);

  useEffect(() => {
    let live = true;
    getSpaceData().then((d) => live && setSpace(d));
    getLatestCommit().then((c) => live && setCommit(c));
    return () => {
      live = false;
    };
  }, []);

  const items: [string, string][] = [
    ["solar_wind", mounted && space ? `${space.solarWind} km/s` : "···"],
    ["kp_index", mounted && space ? space.kp.toFixed(1) : "···"],
    ["humans_in_space", mounted && space ? String(space.people) : "···"],
    [
      "last_deploy",
      mounted && commit ? `${commit.sha} · ${relAge(commit.when)}` : "···",
    ],
  ];

  return (
    <div
      id="telemetry-strip"
      className="mono"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: mobile ? "8px 16px" : "8px 24px",
        fontSize: "var(--text-mono)",
        letterSpacing: "var(--ls-meta)",
        color: "var(--meta)",
      }}
    >
      {items.map(([k, v]) => (
        <span key={k}>
          <span style={{ color: "var(--muted)" }}>{k}:</span>{" "}
          <span style={{ color: "var(--cyan)" }}>{v}</span>
        </span>
      ))}
    </div>
  );
}
