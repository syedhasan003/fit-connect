import { useState } from "react";

export default function CentralInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");

  const handle = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(value.trim());
        setValue("");
      }
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 64,       // sits exactly on top of BottomNav
      left: 0,
      right: 0,
      padding: "10px 20px",
      background: "linear-gradient(to top, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0))",
      zIndex: 10,
    }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handle}
        disabled={disabled}
        placeholder={disabled ? "Central is thinking…" : "Ask Central anything"}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 18px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          fontSize: 14,
          outline: "none",
          opacity: disabled ? 0.5 : 1,
          transition: "opacity 0.2s, border-color 0.2s",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(140,170,255,0.35)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />
    </div>
  );
}