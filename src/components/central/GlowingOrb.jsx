/**
 * GlowingOrb.jsx — Chip in the empty-state of Central
 * ─────────────────────────────────────────────────────────────────
 * Renders CentralMascot (standing Chip) centred on screen.
 * Passes loading → "thinking" state so the thinking-dots animate
 * while the AI is generating a response.
 */

import CentralMascot from "../agent/CentralMascot";

export default function GlowingOrb({ loading = false }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 4,
      }}
    >
      <CentralMascot
        size={110}
        state={loading ? "thinking" : "idle"}
        animate={true}
      />
    </div>
  );
}
