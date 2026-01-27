import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token);
      navigate("/home");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Welcome back</h1>
        <p style={{ opacity: 0.7 }}>Sign in to continue</p>
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

      {error && (
        <div style={{ color: "#ff6b6b", fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          marginTop: 8,
          padding: "12px",
          borderRadius: 12,
          background: "#fff",
          color: "#000",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Signing in..." : "Login"}
      </button>

      <p style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
        New here? <a href="/register" style={{ color: "#fff" }}>Create an account</a>
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
