import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchVaultItems } from "../../api/vault";

export default function Vault() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  useEffect(() => {
    loadVaultItems();
  }, []);

  const loadVaultItems = async () => {
    try {
      const data = await fetchVaultItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load vault:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const storageUsed = 4.2;
  const storageTotal = 10;
  const storagePercent = (storageUsed / storageTotal) * 100;

  const counts = {
    central: items.filter(i => i.source === "central").length,
    workout: items.filter(i => i.type === "workout").length,
    diet: items.filter(i => i.type === "diet").length,
    user: items.filter(i => i.source === "user").length,
  };

  const filteredUserFiles = items.filter(item => {
    if (item.source !== "user") return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      <div style={{ padding: "24px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Vault</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            Your personal fitness library — plans, reports, progress & notes.
          </p>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterTabs active={activeFilter} onChange={setActiveFilter} />
        <StorageCard used={storageUsed} total={storageTotal} percent={storagePercent} />

        <SectionHeader title="Primary Sources" subtitle="Core health & fitness data" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
          marginBottom: 32,
        }}>
          <PrimarySourceCard
            icon="💬"
            title="Central Answers"
            subtitle="AI-generated responses"
            count={counts.central}
            color="#8b5cf6"
            onClick={() => navigate("/vault/central")}
          />
          <PrimarySourceCard
            icon="🏋️"
            title="Manual Workout"
            subtitle="Workout builder plans"
            count={counts.workout}
            color="#6366f1"
            onClick={() => navigate("/vault/workouts")}
          />
          <PrimarySourceCard
            icon="🍽️"
            title="Manual Diet"
            subtitle="Diet builder plans"
            count={counts.diet}
            color="#ec4899"
            onClick={() => alert("Coming soon! Diet Builder is under construction.")}
            disabled
          />
          <PrimarySourceCard
            icon="📊"
            title="Health Memory"
            subtitle="Immutable timeline"
            count="∞"
            color="#06b6d4"
            locked
            onClick={() => navigate("/vault/health-timeline")}
          />
          <PrimarySourceCard
            icon="🏥"
            title="Health Records"
            subtitle="Medical documents"
            count={0}
            color="#10b981"
            onClick={() => alert("Coming soon! Health Records for your medical documents.")}
            disabled
          />
        </div>

        <SectionHeader title="My Files" subtitle="Custom files & folders" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}>
          {filteredUserFiles.map(file => (
            <CustomFileCard key={file.id} file={file} onClick={() => alert("File viewer coming soon!")} />
          ))}
        </div>

        <button
          onClick={() => setShowNewFileModal(true)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 18,
            border: "1px dashed rgba(139, 92, 246, 0.3)",
            background: "rgba(139, 92, 246, 0.05)",
            color: "#a78bfa",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.05)";
            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
          }}
        >
          + New File
        </button>
      </div>

      <button
        onClick={() => setShowNewFileModal(true)}
        style={{
          position: "fixed",
          bottom: 90,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          color: "#fff",
          fontSize: 28,
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
          transition: "all 0.3s ease",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(90deg)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(139, 92, 246, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(139, 92, 246, 0.4)";
        }}
      >
        +
      </button>

      <BottomNav />

      {showNewFileModal && (
        <NewFileModal
          onClose={() => setShowNewFileModal(false)}
          onSave={() => {
            setShowNewFileModal(false);
            loadVaultItems();
          }}
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

function SearchBar({ value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <input
        type="text"
        placeholder="Search workouts, diet plans, reports"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%",
          padding: "16px 20px",
          borderRadius: 16,
          border: isFocused ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
          color: "#fff",
          fontSize: 15,
          outline: "none",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease",
          boxShadow: isFocused ? "0 0 0 3px rgba(139, 92, 246, 0.1)" : "none",
        }}
      />
    </div>
  );
}

function FilterTabs({ active, onChange }) {
  const tabs = ["All", "Pinned", "Workouts", "Diet", "Reports"];
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto" }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            border: "none",
            background: active === tab ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "rgba(255, 255, 255, 0.05)",
            color: active === tab ? "#fff" : "rgba(255,255,255,0.7)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            boxShadow: active === tab ? "0 4px 16px rgba(139, 92, 246, 0.3)" : "none",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function StorageCard({ used, total, percent }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "20px",
      marginBottom: 32,
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
    }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Storage usage</h3>
          <button style={{
            padding: "6px 16px",
            borderRadius: 999,
            border: "none",
            background: "#fff",
            color: "#000",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}>Upgrade</button>
        </div>
        <div style={{
          width: "100%",
          height: 8,
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          marginBottom: 10,
        }}>
          <div style={{
            width: `${percent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
            borderRadius: 999,
          }} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {used} GB of {total} GB used · Auto backup enabled
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{subtitle}</p>}
    </div>
  );
}

function PrimarySourceCard({ icon, title, subtitle, count, color, locked, disabled, onClick }) {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "20px 16px",
        background: disabled
          ? "linear-gradient(135deg, rgba(17, 24, 39, 0.3), rgba(31, 41, 55, 0.2))"
          : isHover
          ? "linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))"
          : "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(16px)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHover && !disabled ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
      }}
    >
      {!disabled && (
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          padding: "1.5px",
          background: isHover ? `linear-gradient(135deg, ${color}cc, ${color}88)` : `linear-gradient(135deg, ${color}66, ${color}44)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: "borderGlow 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}
      {isHover && !disabled && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "200%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
          animation: "shimmer 2s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 32, marginBottom: 12, filter: isHover ? `drop-shadow(0 0 12px ${color}66)` : "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>
          {icon}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
          {locked && <span style={{ fontSize: 14 }}>🔒</span>}
          {disabled && (
            <span style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600,
            }}>SOON</span>
          )}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{subtitle}</p>
        <div style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 999,
          background: `${color}22`,
          fontSize: 12,
          fontWeight: 600,
          color: disabled ? "rgba(255,255,255,0.4)" : color,
        }}>
          {typeof count === 'number' ? `${count} items` : count}
        </div>
      </div>
    </div>
  );
}

function CustomFileCard({ file, onClick }) {
  const [isHover, setIsHover] = useState(false);
  const getIcon = (type) => {
    const icons = { workout: '🏋️', diet: '🍽️', report: '📊', note: '📝' };
    return icons[type] || '📄';
  };
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 16,
        padding: "18px 16px",
        background: isHover ? "linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.4))" : "linear-gradient(135deg, rgba(17, 24, 39, 0.4), rgba(31, 41, 55, 0.2))",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isHover ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        padding: "1px",
        background: isHover ? "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))" : "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>{getIcon(file.type)}</div>
        <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>{file.title}</h4>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{file.category}</p>
      </div>
    </div>
  );
}

function NewFileModal({ onClose, onSave }) {
  return (
    <>
      <div onClick={onClose} style={{
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
        borderTop: "2px solid rgba(139, 92, 246, 0.3)",
      }}>
        <div style={{
          width: 40,
          height: 4,
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: 2,
          margin: "0 auto 24px",
        }} />
        <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 600 }}>Coming Soon!</h3>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
          File creation will be available soon. For now, your workouts are automatically saved to the vault.
        </p>
        <button onClick={onClose} style={{
          width: "100%",
          padding: "14px",
          borderRadius: 14,
          border: "none",
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          Got it
        </button>
      </div>
    </>
  );
}