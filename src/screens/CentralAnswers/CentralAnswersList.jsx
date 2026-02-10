import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVaultItems } from "../../api/vault";

export default function CentralAnswersList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await fetchVaultItems();
      const centralItems = data.filter(item => item.source === "central");
      setItems(centralItems);
    } catch (error) {
      console.error("Failed to load central answers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "40px",
    }}>
      <div style={{ padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
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
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 600 }}>
            Central Answers
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            AI-generated responses saved from Central
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: 15,
            outline: "none",
            marginBottom: 24,
          }}
        />

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(139, 92, 246, 0.3)",
              borderTop: "3px solid #8b5cf6",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto",
            }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredItems.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
              No answers yet
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              Save AI responses from Central to see them here
            </p>
          </div>
        )}

        {/* Items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredItems.map((item) => (
            <AnswerCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/vault/central/${item.id}`)}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function AnswerCard({ item, onClick }) {
  const [isHover, setIsHover] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "20px",
        background: isHover
          ? "linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))"
          : "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(16px)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isHover ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Animated border */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        padding: "1px",
        background: isHover
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(99, 102, 241, 0.5))"
          : "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: "0 0 6px",
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
            }}>
              {item.title}
            </h3>
            {item.summary && (
              <p style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.5,
              }}>
                {item.summary}
              </p>
            )}
          </div>
          {item.pinned && (
            <span style={{ fontSize: 18, marginLeft: 12 }}>📌</span>
          )}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
        }}>
          <span>💬 Central</span>
          <span>•</span>
          <span>{formatDate(item.created_at)}</span>
        </div>
      </div>
    </div>
  );
}