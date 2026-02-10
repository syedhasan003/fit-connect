import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItemById, deleteVaultItem, updateVaultItem } from "../../api/vault";

export default function CentralAnswerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadAnswer();
  }, [id]);

  const loadAnswer = async () => {
    try {
      const data = await fetchVaultItemById(id);
      setAnswer(data);
    } catch (error) {
      console.error("Failed to load answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVaultItem(id);
      navigate("/vault/central");
    } catch (error) {
      console.error("Failed to delete answer:", error);
      alert("Failed to delete answer. Please try again.");
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateVaultItem(id, { is_pinned: !answer.is_pinned });
      setAnswer({ ...answer, is_pinned: !answer.is_pinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleAskFollowUp = () => {
    // Navigate to Central with context of this conversation
    navigate("/central", { 
      state: { 
        followUpContext: {
          id: answer.id,
          title: answer.title,
          content: answer.content
        }
      } 
    });
  };

  if (loading) return <LoadingState />;
  if (!answer) return <ErrorState />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      <div style={{ padding: "24px 20px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b5cf6",
              fontSize: 28,
              cursor: "pointer",
              padding: 0,
              marginBottom: 8,
            }}
          >
            ←
          </button>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 0.3,
                lineHeight: 1.3,
              }}>
                {answer.title || "Untitled Answer"}
              </h1>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
              }}>
                <span style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  💬 Central
                </span>
                <span style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                }}>
                  •
                </span>
                <span style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                }}>
                  {new Date(answer.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={handleTogglePin}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                padding: 8,
              }}
            >
              {answer.is_pinned ? "📌" : "📍"}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{
          position: "relative",
          borderRadius: 20,
          padding: "24px",
          background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
          backdropFilter: "blur(12px)",
          marginBottom: 24,
          overflow: "hidden",
        }}>
          {/* Animated border */}
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            padding: "1px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: "borderGlow 3s ease-in-out infinite",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.85)",
              whiteSpace: "pre-wrap",
            }}>
              {answer.content}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}>
          <ActionButton
            icon="💬"
            label="Ask Follow-up"
            color="#8b5cf6"
            onClick={handleAskFollowUp}
          />
          <ActionButton
            icon="🗑️"
            label="Delete"
            color="#ef4444"
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      <BottomNav />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }) {
  const [isHover, setIsHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        padding: "14px",
        borderRadius: 14,
        border: `1px solid ${color}30`,
        background: isHover ? `${color}20` : `${color}10`,
        color: color,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
      }} />
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgb(17, 24, 39), rgb(31, 41, 55))",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: "24px 20px 40px",
        zIndex: 101,
        borderTop: "2px solid rgba(239, 68, 68, 0.3)",
      }}>
        <div style={{
          width: 40,
          height: 4,
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: 2,
          margin: "0 auto 24px",
        }} />
        <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 600, color: "#fff" }}>
          Delete Answer?
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
          This action cannot be undone. This Central AI response will be permanently deleted from your vault.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1,
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "#ef4444",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
    }}>
      <div style={{
        width: 50,
        height: 50,
        border: "3px solid rgba(139, 92, 246, 0.2)",
        borderTop: "3px solid #8b5cf6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ErrorState() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      color: "#fff",
      padding: 20,
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Answer Not Found</h2>
      <button
        onClick={() => navigate("/vault/central")}
        style={{
          padding: "12px 24px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Back to Central Answers
      </button>
    </div>
  );
}