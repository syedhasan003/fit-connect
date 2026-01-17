import { useNavigate, useLocation } from "react-router-dom";
import "./DietBottomNav.css";

export default function DietBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path;

  return (
    <nav className="diet-bottom-nav">
      <span className={isActive("/diet") ? "active" : ""} onClick={() => navigate("/diet")}>
        Home
      </span>
      <span onClick={() => alert("Snap coming soon")}>Snap</span>
      <span className="add" onClick={() => navigate("/diet/log")}>+</span>
      <span onClick={() => alert("Plans coming soon")}>Plans</span>
    </nav>
  );
}
