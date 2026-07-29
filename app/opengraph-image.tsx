import { ImageResponse } from "next/og";

export const alt = "Zhyronne Batican — Full Stack Developer, AI Engineer, and UI/UX Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          background: "#fafafa",
          color: "#111111",
          fontFamily: "Arial, sans-serif",
          border: "1px solid #e5e5e5",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.06em" }}>ZB.</div>
          <div style={{ display: "flex", gap: 24, fontSize: 16, color: "#666666" }}>
            <span>FULL STACK</span><span>AI</span><span>PRODUCT DESIGN</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "monospace", fontSize: 18, color: "#666666" }}>
            // PORTFOLIO
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 22,
              fontSize: 104,
              fontWeight: 800,
              lineHeight: 0.86,
              letterSpacing: "-0.07em",
            }}
          >
            <span>Zhyronne</span><span>Batican</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ width: 620, fontSize: 24, lineHeight: 1.35 }}>
            Modern web applications, AI-powered tools, and thoughtful digital experiences.
          </span>
          <span style={{ paddingBottom: 4, fontFamily: "monospace", fontSize: 17, color: "#666666" }}>
            AVAILABLE FOR SELECTED PROJECTS
          </span>
        </div>
      </div>
    ),
    size,
  );
}
