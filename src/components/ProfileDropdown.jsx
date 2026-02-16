import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProfileDropdown({ userName, isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleSettings = () => {
    // For now, navigate to profile
    // Later you can create a dedicated settings page
    navigate("/profile");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        left: 0,
        minWidth: 220,
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)",
        zIndex: 1000,
        animation: "slideDown 0.2s ease-out",
        overflow: "hidden",
      }}
    >
      {/* User Info Section */}
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 4,
        }}>
          {userName}
        </div>
        <div style={{
          fontSize: 13,
          color: "rgba(255, 255, 255, 0.5)",
        }}>
          Account settings
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ padding: "8px 0" }}>
        <MenuItem
          icon="⚙️"
          label="Settings"
          onClick={handleSettings}
        />
        <MenuItem
          icon="👤"
          label="Profile"
          onClick={handleProfile}
        />
        <MenuItem
          icon="🚪"
          label="Logout"
          onClick={handleLogout}
          danger
        />
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }) {
  const [isHover, setIsHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        width: "100%",
        padding: "12px 16px",
        border: "none",
        background: isHover
          ? danger
            ? "rgba(239, 68, 68, 0.1)"
            : "rgba(139, 92, 246, 0.1)"
          : "transparent",
        color: danger ? "#ef4444" : "#fff",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all 0.15s ease",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}