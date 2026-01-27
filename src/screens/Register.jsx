import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      await api.post("/auth/register", { email, password, role });
      navigate("/login");
    } catch {
      setError("Registration failed. Try another email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1>Create account</h1>
        <p style={{ opacity: 0.7 }}>Start your fitness journey</p>
      </div>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={inputStyle}
      >
        <option value="user">User</option>
        <option value="gym_owner">Gym Owner</option>
      </select>

      {error && <div style={{ color: "#ff6b6b" }}>{error}</div>}

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          padding: "12px",
          borderRadius: 12,
          background: "#fff",
          color: "#000",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Creating..." : "Create account"}
      </button>

      <p style={{ fontSize: 14, opacity: 0.7 }}>
        Already have an account? <a href="/login" style={{ color: "#fff" }}>Login</a>
      </p>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  outline: "none",
};
