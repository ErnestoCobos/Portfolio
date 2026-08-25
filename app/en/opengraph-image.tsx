import { ImageResponse } from "next/og";

// Without this file /en inherits the root OG image, whose subhead renders in
// Spanish — wrong locale on every EN share. Same visual system as
// app/opengraph-image.tsx (tokens, mono header, accent stripe), copy in English.
export const runtime = "edge";
export const revalidate = 31536000;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps";

export default function OpengraphImageEn() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0F",
          color: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Top accent stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              "linear-gradient(90deg, #00D4FF 0%, #7C3AED 100%)",
          }}
        />

        {/* Mono header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            color: "#94A3B8",
            letterSpacing: "0.05em",
            marginBottom: 64,
          }}
        >
          <span style={{ color: "#F8FAFC" }}>cobos</span>
          <span style={{ color: "#00D4FF" }}>::</span>
          <span style={{ color: "#94A3B8" }}>cloud_architect</span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "#F8FAFC",
            marginBottom: 32,
          }}
        >
          <span>
            Cloud Architect <span style={{ color: "#00D4FF" }}>+</span>
          </span>
          <span style={{ color: "#7C3AED" }}>DevSecOps</span>
        </div>

        {/* Subhead */}
        <div
          style={{
            display: "flex",
            color: "#94A3B8",
            fontSize: 28,
            lineHeight: 1.4,
            maxWidth: 940,
          }}
        >
          Legacy → cloud-native migrations, Kubernetes in regulated sectors,
          DevSecOps and FinOps. I build platforms as a product.
        </div>

        {/* Footer band */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 64,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            color: "#94A3B8",
          }}
        >
          <span>cobos.io/en</span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#00D4FF",
              }}
            />
            <span>online</span>
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
