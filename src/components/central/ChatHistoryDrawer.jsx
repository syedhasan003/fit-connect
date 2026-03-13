/**
 * ChatHistoryDrawer
 * ───────────────────────────────────────────────────────────────
 * Slide-in drawer from the left showing past Central conversations.
 * Matches the Claude / ChatGPT mobile pattern.
 *
 * Props:
 *   isOpen           — boolean
 *   onClose          — () => void
 *   sessions         — [{ id, title, preview, updatedAt }]
 *   currentSessionId — string | null
 *   onLoadSession    — (id) => void
 *   onNewChat        — () => void
 *   onDeleteSession  — (id) => void
 */

import { useState } from "react";

// ── Relative time ─────────────────────────────────────────────────────────
function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const m = Math.floor(diffMs / 60_000);
  const h = Math.floor(diffMs / 3_600_000);
  const d = Math.floor(diffMs / 86_400_000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d === 1) return "Yesterday";
  if (d < 7)   return `${d} days ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Session item ──────────────────────────────────────────────────────────
function SessionItem({ session, isActive, onLoad, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(session.id);
    } else {
      setConfirmDelete(true);
      // Auto-cancel confirmation after 2.5s
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div
      onClick={() => onLoad(session.id)}
      style={{
        position: "relative",
        padding: "13px 16px",
        borderRadius: 12,
        background: isActive
          ? "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(99,102,241,0.1))"
          : "transparent",
        border: isActive
          ? "1px solid rgba(139,92,246,0.25)"
          : "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.18s ease",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#1A1A1A";
          e.currentTarget.style.border = "1px solid #1E1E1E";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.border = "1px solid transparent";
        }
      }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div style={{
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: 3,
          borderRadius: 999,
          background: "linear-gradient(180deg, #8b5cf6, #6366f1)",
        }} />
      )}

      {/* Chat icon */}
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: isActive
          ? "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))"
          : "#1A1A1A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 14,
        marginTop: 1,
      }}>
        💬
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 13.5,
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#FFFFFF" : "#9CA3AF",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          letterSpacing: 0.1,
        }}>
          {session.title}
        </p>
        {session.preview && (
          <p style={{
            margin: "3px 0 0",
            fontSize: 12,
            color: "#6B7280",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.4,
          }}>
            {session.preview}
          </p>
        )}
        <p style={{
          margin: "4px 0 0",
          fontSize: 11,
          color: "#6B7280",
          fontWeight: 400,
        }}>
          {timeAgo(session.updatedAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDeleteClick}
        title={confirmDelete ? "Tap again to delete" : "Delete conversation"}
        style={{
          flexShrink: 0,
          padding: "4px 7px",
          borderRadius: 6,
          border: confirmDelete ? "1px solid rgba(239,68,68,0.4)" : "none",
          background: confirmDelete ? "rgba(239,68,68,0.12)" : "transparent",
          color: confirmDelete ? "#f87171" : "#6B7280",
          fontSize: 13,
          cursor: "pointer",
          transition: "all 0.15s ease",
          marginTop: 2,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          if (!confirmDelete) {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#f87171";
          }
        }}
        onMouseLeave={(e) => {
          if (!confirmDelete) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#6B7280";
          }
        }}
      >
        {confirmDelete ? "✓" : "×"}
      </button>
    </div>
  );
}

// ── Main drawer ────────────────────────────────────────────────────────────
export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  sessions = [],
  currentSessionId,
  onLoadSession,
  onNewChat,
  onDeleteSession,
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "82vw",
          maxWidth: 320,
          background: "#0A0A0A",
          borderRight: "1px solid #1E1E1E",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: isOpen ? "4px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "56px 20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1E1E1E",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 10px rgba(139,92,246,0.7)",
            }} />
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: 0.3,
            }}>
              Chats
            </span>
            {sessions.length > 0 && (
              <span style={{
                fontSize: 11,
                color: "#6B7280",
                fontWeight: 500,
                marginLeft: 2,
              }}>
                {sessions.length}
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #1E1E1E",
              background: "#1A1A1A",
              color: "#6B7280",
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#222222";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1A1A1A";
              e.currentTarget.style.color = "#6B7280";
            }}
          >
            ‹
          </button>
        </div>

        {/* ── New chat button ── */}
        <div style={{ padding: "14px 16px 10px", flexShrink: 0 }}>
          <button
            onClick={onNewChat}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(139,92,246,0.3)",
              background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))",
              color: "#c4b5fd",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.18s ease",
              letterSpacing: 0.2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(99,102,241,0.16))";
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))";
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
            }}
          >
            <span style={{
              fontSize: 18,
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              ✏️
            </span>
            New chat
          </button>
        </div>

        {/* ── Sessions list ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 10px 24px",
          scrollbarWidth: "none",
        }}>
          {sessions.length === 0 ? (
            <div style={{
              padding: "48px 16px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
              <p style={{
                color: "#9CA3AF",
                fontSize: 13.5,
                lineHeight: 1.6,
              }}>
                Your past conversations will appear here
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onLoad={(id) => { onLoadSession(id); onClose(); }}
                  onDelete={onDeleteSession}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 20px 32px",
          borderTop: "1px solid #1E1E1E",
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: 11,
            color: "#6B7280",
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            Conversations saved on this device
          </p>
        </div>

        <style>{`
          .central-history-list::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </>
  );
}
