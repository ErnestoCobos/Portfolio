import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 31536000;
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Site icon (32×32). Renders the cobos:: signature glyph as a small
 * cyan glyph centered on the brand bg. Generated dynamically via
 * next/og so it stays in sync with the brand palette without managing
 * a binary asset.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-monospace, monospace",
          color: "#00D4FF",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.05em",
        }}
      >
        ::
      </div>
    ),
    { ...size }
  );
}
