import { ImageResponse } from "next/og";
import { BRAND, PARENT } from "@/lib/brand";

// Default share image for every page that doesn't set its own (product pages use the product photo).
export const alt = `${BRAND.name}: pure vanilla, from bean to bottle`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's heading face (Plus Jakarta Sans ExtraBold); falls back to the default font if unreachable. */
async function loadHeadingFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-800-normal.woff");
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await loadHeadingFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#191d1f",
          color: "#faf6ee",
          fontFamily: font ? "Jakarta" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#9ce800" }}>{BRAND.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -4 }}>
            Pure vanilla,
          </div>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -4 }}>
            from bean to bottle<span style={{ color: "#9ce800" }}>.</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "rgba(250,246,238,0.7)" }}>
          <span>Beans · Extract · Powder · Caviar · Wholesale</span>
          <span>US branch of {PARENT.name}</span>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Jakarta", data: font, weight: 800, style: "normal" }] : undefined }
  );
}
