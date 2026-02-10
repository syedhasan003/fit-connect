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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Attempting login...');
      const res = await api.post("/auth/login", { email, password });
      console.log('✅ Login response:', res.data);
      
      // This should save to localStorage via AuthContext
      login(res.data.access_token);
      console.log('💾 Token passed to AuthContext');
      
      // Verify token was saved
      const savedToken = localStorage.getItem('token');
      console.log('🔍 Token in localStorage:', savedToken ? 'YES' : 'NO');
      
      navigate("/home");
    } catch (err) {
      console.error('❌ Login error:', err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        position: "relative",
        borderRadius: 24,
        padding: "40px 32px",
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.4))",
        backdropFilter: "blur(16px)",
        overflow: "hidden",
      }}>
        {/* Animated border */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          padding: "1px",
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(99, 102, 241, 0.5))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: "borderGlow 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Welcome back
            </h1>
            <p style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
            }}>
              Sign in to continue
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: "#fca5a5" }}>
                ❌ {error}
              </p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: loading 
                  ? "rgba(139, 92, 246, 0.5)" 
                  : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register link */}
          <p style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}>
            New here?{" "}
            <a
              href="/register"
              style={{
                color: "#a78bfa",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Create an account
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}