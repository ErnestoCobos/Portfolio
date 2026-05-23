import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 31536000;
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon (180×180) — used when "Add to Home Screen" on iOS.
 * Larger version of the favicon: bg + cyan/violet gradient stripe up
 * top + the cobos:: glyph centered. No transparency so iOS doesn't
 * round-corner-clip awkwardly.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0F",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {/* Top stripe gradient — same as OG images */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #00D4FF 0%, #7C3AED 100%)",
          }}
        />
        {/* Centered glyph */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F8FAFC",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          cobos<span style={{ color: "#00D4FF" }}>::</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
