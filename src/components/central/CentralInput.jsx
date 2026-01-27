import { useState } from "react";

export default function CentralInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit(value);
        setValue("");
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 70,
        left: 0,
        right: 0,
        padding: 16,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Central is thinking..." : "Ask Central anything about fitness"}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 14,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
        }}
      />
    </div>
  );
}
