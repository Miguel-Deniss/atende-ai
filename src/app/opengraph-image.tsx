import { ImageResponse } from "next/og";

export const alt = "AtendeAI — atendimento conectado ao trabalho real";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#000000",
        color: "#ffffff",
        padding: "76px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "54px",
              height: "54px",
              borderRadius: "13px",
              background: "#3b82f6",
            }}
          >
            AI
          </div>
          AtendeAI
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "980px" }}>
          <div style={{ color: "#60a5fa", fontSize: "22px", marginBottom: "24px" }}>
            ATENDIMENTO CONECTADO AO TRABALHO REAL
          </div>
          <div style={{ fontSize: "68px", lineHeight: 1.06, letterSpacing: "-3px" }}>
            WhatsApp, IA, agenda e controle humano em um só fluxo.
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
