import { useLocation, useNavigate } from "react-router-dom";
import { useAgent } from "../../context/AgentContext";
import "../BottomNav.css";

export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isConnected } = useAgent();

  const isActive = (path) =>
    location.pathname === path ? "active" : "";

  return (
    <nav className="bottom-nav">
      <span className={isActive("/")}        onClick={() => navigate("/")}>Home</span>
      <span className={isActive("/discover")} onClick={() => navigate("/discover")}>Discover</span>

      {/* Central tab — pulsing dot when agent is connected */}
      <span
        className={isActive("/central")}
        onClick={() => navigate("/central")}
        style={{ position: "relative" }}
      >
        Central
        {isConnected && (
          <span style={{
            position: "absolute",
            top: -2,
            right: -6,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#8b5cf6",
            boxShadow: "0 0 5px 2px rgba(139,92,246,0.6)",
            animation: "agentNavPulse 2.4s ease-in-out infinite",
          }} />
        )}
      </span>

      <span className={isActive("/vault")}   onClick={() => navigate("/vault")}>Vault</span>
      <span className={isActive("/profile")} onClick={() => navigate("/profile")}>Profile</span>

      <style>{`
        @keyframes agentNavPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.25); box-shadow: 0 0 8px 3px rgba(139,92,246,0.8); }
        }
      `}</style>
    </nav>
  );
}
