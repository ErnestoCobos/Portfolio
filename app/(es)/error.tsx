"use client";

import { useEffect } from "react";
import { ErrorTerminal } from "../components/ErrorTerminal";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log to the browser console so devs can grab the stack from the
  // production error overlay. The digest is what actually maps to the
  // server-side log if this was a server-thrown error.
  useEffect(() => {
    console.error("[cobos] runtime error:", error);
  }, [error]);

  return (
    <main
      className="cobos-art"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "10% -10% 10% -10%",
          background:
            "radial-gradient(circle at 50% 50%, var(--violet-tint-soft) 0%, transparent 55%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", width: "100%" }}>
        <ErrorTerminal error={error} reset={reset} />
      </div>
    </main>
  );
}
