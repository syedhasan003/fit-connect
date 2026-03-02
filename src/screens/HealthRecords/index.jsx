import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHealthRecords, createHealthRecord, deleteHealthRecord } from "../../api/reminders";

// ─── Record type config ───────────────────────────────────────────────────
const RECORD_TYPES = [
  { id: "all",         label: "All",          emoji: "📋" },
  { id: "blood_report",label: "Blood Report", emoji: "🩸" },
  { id: "prescription",label: "Prescription", emoji: "💊" },
  { id: "xray",        label: "X-Ray",        emoji: "🦴" },
  { id: "scan",        label: "Scan / MRI",   emoji: "🔬" },
  { id: "vaccination", label: "Vaccination",  emoji: "💉" },
  { id: "surgery",     label: "Surgery",      emoji: "🏥" },
  { id: "dental",      label: "Dental",       emoji: "🦷" },
  { id: "eye",         label: "Eye",          emoji: "👁️" },
  { id: "doctor_note", label: "Doctor Note",  emoji: "📝" },
  { id: "other",       label: "Other",        emoji: "📁" },
];

const TYPE_COLORS = {
  blood_report: "#ef4444",
  prescription: "#8b5cf6",
  xray:         "#6366f1",
  scan:         "#3b82f6",
  vaccination:  "#10b981",
  surgery:      "#f59e0b",
  dental:       "#06b6d4",
  eye:          "#ec4899",
  doctor_note:  "#84cc16",
  other:        "#6b7280",
};

function getTypeInfo(id) {
  return RECORD_TYPES.find(t => t.id === id) || RECORD_TYPES[RECORD_TYPES.length - 1];
}

// ─── Add Record modal ─────────────────────────────────────────────────────
function AddRecordModal({ onClose, onSaved }) {
  const [recordType,   setRecordType]   = useState("blood_report");
  const [title,        setTitle]        = useState("");
  const [recordDate,   setRecordDate]   = useState(new Date().toISOString().split("T")[0]);
  const [doctorName,   setDoctorName]   = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [notes,        setNotes]        = useState("");
  const [files,        setFiles]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const fileRef = useRef();

  const FORM_TYPES = RECORD_TYPES.filter(t => t.id !== "all");

  const handleSubmit = async () => {
    if (!title.trim() || !recordDate) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("record_type",   recordType);
      fd.append("title",         title.trim());
      fd.append("record_date",   recordDate);
      if (doctorName.trim())   fd.append("doctor_name",   doctorName.trim());
      if (facilityName.trim()) fd.append("facility_name", facilityName.trim());
      if (notes.trim())        fd.append("notes",         notes.trim());
      fd.append("tags", "[]");
      files.forEach(f => fd.append("files", f));

      await createHealthRecord(fd);
      onSaved();
    } catch {
      setError("Failed to save record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111", borderRadius: "24px 24px 0 0",
        padding: "24px 20px 40px", maxHeight: "92vh", overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)",
          margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Add Health Record</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none",
            color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {/* Type selector */}
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
          Record type
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {FORM_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => setRecordType(t.id)}
              style={{
                padding: "7px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                background: recordType === t.id ? `rgba(${hexToRgb(TYPE_COLORS[t.id] || "#6b7280")},0.25)` : "rgba(255,255,255,0.06)",
                color: recordType === t.id ? (TYPE_COLORS[t.id] || "#fff") : "rgba(255,255,255,0.55)",
                outline: recordType === t.id ? `1px solid ${TYPE_COLORS[t.id] || "#fff"}40` : "none",
                fontSize: 13, fontWeight: recordType === t.id ? 600 : 400,
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <Label>Title *</Label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Annual blood panel, Chest X-Ray"
            style={inputStyle} />
        </div>

        {/* Date */}
        <div style={{ marginBottom: 16 }}>
          <Label>Date of record *</Label>
          <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        {/* Doctor + Facility */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Label>Doctor name</Label>
            <input value={doctorName} onChange={e => setDoctorName(e.target.value)}
              placeholder="Dr. Sharma" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Hospital / Lab</Label>
            <input value={facilityName} onChange={e => setFacilityName(e.target.value)}
              placeholder="Apollo, Lal Path" style={inputStyle} />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <Label>Notes (optional)</Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Doctor's observations, key values, follow-up needed..."
            rows={3}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
        </div>

        {/* File upload */}
        <div style={{ marginBottom: 20 }}>
          <Label>Attach files (optional)</Label>
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)",
              cursor: "pointer", fontSize: 14,
            }}>
            📎 Tap to attach PDF, image, or document
          </button>
          <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={e => setFiles(Array.from(e.target.files || []))}
            style={{ display: "none" }} />
          {files.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {files.map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "#a78bfa", padding: "4px 0" }}>
                  📄 {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#fca5a5" }}>❌ {error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!title.trim() || !recordDate || loading}
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: title.trim() && recordDate && !loading
              ? "linear-gradient(135deg,#8b5cf6,#6366f1)"
              : "rgba(255,255,255,0.08)",
            color: title.trim() && recordDate && !loading ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize: 15, fontWeight: 700, cursor: title.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {loading ? (
            <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid #fff", borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />Saving...</>
          ) : "Save Record"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Record card ──────────────────────────────────────────────────────────
function RecordCard({ record, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = getTypeInfo(record.record_type);
  const color = TYPE_COLORS[record.record_type] || "#6b7280";

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.03)", marginBottom: 12,
    }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "16px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", display: "flex", gap: 14, alignItems: "center",
        }}>
        {/* Type badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {typeInfo.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {record.title}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              {formatDate(record.record_date)}
            </span>
            {record.doctor_name && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                · {record.doctor_name}
              </span>
            )}
          </div>
        </div>

        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {record.facility_name && (
            <p style={{ margin: "12px 0 6px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              🏥 {record.facility_name}
            </p>
          )}
          {record.notes && (
            <p style={{ margin: "8px 0", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              {record.notes}
            </p>
          )}
          {record.file_paths && record.file_paths.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {record.file_paths.map((fp, i) => (
                <div key={i} style={{ fontSize: 13, color: "#a78bfa", padding: "3px 0" }}>
                  📎 {fp.split("/").pop()}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onDelete(record.id)}
            style={{
              marginTop: 14, padding: "8px 14px", borderRadius: 10, border: "none",
              background: "rgba(239,68,68,0.12)", color: "#f87171",
              fontSize: 13, cursor: "pointer", fontWeight: 500,
            }}>
            Delete record
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
export default function HealthRecords() {
  const navigate = useNavigate();
  const [records, setRecords]   = useState([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHealthRecords(filter === "all" ? null : filter);
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this health record?")) return;
    try {
      await deleteHealthRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  const grouped = records.reduce((acc, r) => {
    const year = r.record_date ? new Date(r.record_date).getFullYear() : "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {});
  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "transparent", border: "none", color: "#8b5cf6",
            fontSize: 26, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          ←
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Health Records</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Your complete medical history, in one place
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
            + Add
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "16px 20px 0", overflowX: "auto", display: "flex", gap: 8, paddingBottom: 16,
        borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {RECORD_TYPES.map(t => (
          <button key={t.id} type="button" onClick={() => setFilter(t.id)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: filter === t.id ? 600 : 400,
              background: filter === t.id ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
              color: filter === t.id ? "#a78bfa" : "rgba(255,255,255,0.55)",
              outline: filter === t.id ? "1px solid rgba(139,92,246,0.5)" : "none",
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 60, color: "rgba(255,255,255,0.3)" }}>
            Loading...
          </div>
        )}

        {!loading && records.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              No records yet
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: "6px 0 20px" }}>
              Add your blood reports, prescriptions, X-rays — keep everything in one place
            </p>
            <button onClick={() => setShowAdd(true)}
              style={{
                padding: "12px 24px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>
              Add your first record
            </button>
          </div>
        )}

        {!loading && sortedYears.map(year => (
          <div key={year} style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>
              {year}
            </p>
            {grouped[year].map(r => (
              <RecordCard key={r.id} record={r} onDelete={handleDelete} />
            ))}
          </div>
        ))}
      </div>

      {showAdd && (
        <AddRecordModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600,
      color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </p>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)", color: "#fff",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
