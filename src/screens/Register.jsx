import { useState } from "react";
import api from "../api/axios";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.post("/auth/register", {
        email,
        password,
        role,
      });

      // After successful registration, go to login
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      setError("Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="gym_owner">Gym Owner</option>
      </select>
      <br /><br />

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Login</a>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
