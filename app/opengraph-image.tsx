import { ImageResponse } from "next/og"

export const alt = "Reflectify — academic feedback, made clear"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#fffaf7",
        color: "#18181b",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          display: "flex",
          width: 720,
          height: 720,
          borderRadius: 9999,
          right: -230,
          top: -340,
          background: "#fed7aa",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          width: 440,
          height: 440,
          borderRadius: 9999,
          right: 90,
          bottom: -300,
          background: "#ede9fe",
        }}
      />
      <div
        style={{
          width: "100%",
          padding: "72px 82px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 8px 26px rgba(249, 115, 22, 0.16)",
              color: "#f97316",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", fontSize: 29, fontWeight: 700 }}>
            Reflectify
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 770 }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 20,
              color: "#ea580c",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Academic feedback workspace
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 65,
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: "-0.045em",
            }}
          >
            Academic feedback, made clear.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#71717a",
            fontSize: 24,
            lineHeight: 1.4,
          }}
        >
          Collect student voice. Manage feedback. Find meaningful insight.
        </div>
      </div>
    </div>,
    size
  )
}
