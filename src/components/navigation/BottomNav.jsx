import { useLocation, useNavigate } from "react-router-dom";
import "../BottomNav.css";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "active" : "";

  return (
    <nav className="bottom-nav">
      <span className={isActive("/")} onClick={() => navigate("/")}>Home</span>
      <span className={isActive("/discover")} onClick={() => navigate("/discover")}>Discover</span>
      <span className={isActive("/central")} onClick={() => navigate("/central")}>Central</span>
      <span className={isActive("/vault")} onClick={() => navigate("/vault")}>Vault</span>
      <span className={isActive("/profile")} onClick={() => navigate("/profile")}>Profile</span>
    </nav>
  );
}
