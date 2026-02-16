import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { updateReminder } from "../../api/reminders";

export default function EditReminder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingReminder = location.state?.reminder;

  const [type, setType] = useState("workout");
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({ hour: 12, minute: 0, period: 'PM' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReminder) {
      setType(existingReminder.type);
      setMessage(existingReminder.message);

      // Parse the scheduled_at timestamp
      const scheduledDate = new Date(existingReminder.scheduled_at);
      setSelectedDate(scheduledDate);

      // Extract hour and minute
      let hours = scheduledDate.getHours();
      const minutes = scheduledDate.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';

      // Convert to 12-hour format
      if (hours === 0) {
        hours = 12;
      } else if (hours > 12) {
        hours = hours - 12;
      }

      setSelectedTime({ hour: hours, minute: minutes, period });
    }
  }, [existingReminder]);

  const types = [
    { value: "workout", label: "Workout" },
    { value: "meal", label: "Meal" },
    { value: "medication", label: "Medication" },
    { value: "checkup", label: "Checkup" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message) {
      alert("Please enter a message");
      return;
    }

    setLoading(true);

    try {
      // Convert 12-hour to 24-hour
      let hour24 = selectedTime.hour;
      if (selectedTime.period === 'PM' && selectedTime.hour !== 12) {
        hour24 = selectedTime.hour + 12;
      } else if (selectedTime.period === 'AM' && selectedTime.hour === 12) {
        hour24 = 0;
      }

      // Create local date/time correctly
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      const scheduledDate = new Date(year, month, day, hour24, selectedTime.minute, 0, 0);
      const scheduledAt = scheduledDate.toISOString();

      await updateReminder(id, {
        type,
        message,
        scheduled_at: scheduledAt,
        is_active: true,
        consent_required: false,
      });

      navigate('/reminders');

    } catch (error) {
      console.error('Failed to update reminder:', error);
      alert(`Failed to update reminder: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
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
        <h1 style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}>
          Edit Reminder
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 20px" }}>
        {/* TYPE */}
        <Section title="Type">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}>
            {types.map((t) => (
              <TypeButton
                key={t.value}
                label={t.label}
                selected={type === t.value}
                onClick={() => setType(t.value)}
              />
            ))}
          </div>
        </Section>

        {/* MESSAGE */}
        <Section title="Message">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., Time for your workout"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 16,
              outline: "none",
            }}
          />
        </Section>

        {/* DATE - COMPACT WITH POPUP */}
        <Section title="Date">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </Section>

        {/* TIME - ALL MINUTES */}
        <Section title="Time">
          <TimePicker
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />
        </Section>

        {/* SUBMIT */}
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px",
          background: "linear-gradient(to top, #000 80%, transparent)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "none",
              background: loading
                ? "rgba(139, 92, 246, 0.5)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Updating..." : "Update Reminder"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Reuse Calendar component from CreateReminder
function Calendar({ selectedDate, onSelectDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isSelected = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return date.getTime() === selected.getTime();
  };

  const isToday = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getTime() === today.getTime();
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelectDate(newDate);
    setIsOpen(false);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          fontSize: 16,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{formatDate(selectedDate)}</span>
        <span style={{ fontSize: 20 }}>📅</span>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 100,
            }}
          />

          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 8,
            padding: "20px",
            borderRadius: 14,
            background: "linear-gradient(135deg, rgb(17, 24, 39), rgb(31, 41, 55))",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            zIndex: 101,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8b5cf6",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: "8px 12px",
                }}
              >
                ←
              </button>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
              }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8b5cf6",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: "8px 12px",
                }}
              >
                →
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} style={{
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                }}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
            }}>
              {days.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={!day}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 8,
                    border: "none",
                    background: isSelected(day)
                      ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                      : isToday(day)
                      ? "rgba(139, 92, 246, 0.2)"
                      : "transparent",
                    color: day ? "#fff" : "transparent",
                    fontSize: 14,
                    fontWeight: isSelected(day) ? 600 : 400,
                    cursor: day ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  {day || ''}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Reuse TimePicker component from CreateReminder
function TimePicker({ selectedTime, onSelectTime }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
    }}>
      <div>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}>
          Hour
        </label>
        <select
          value={selectedTime.hour}
          onChange={(e) => onSelectTime({ ...selectedTime, hour: parseInt(e.target.value) })}
          style={{
            width: "100%",
            padding: "14px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {hours.map(h => (
            <option key={h} value={h} style={{ background: "#1f1f1f" }}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}>
          Minute
        </label>
        <select
          value={selectedTime.minute}
          onChange={(e) => onSelectTime({ ...selectedTime, minute: parseInt(e.target.value) })}
          style={{
            width: "100%",
            padding: "14px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {minutes.map(m => (
            <option key={m} value={m} style={{ background: "#1f1f1f" }}>
              {m.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}>
          Period
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}>
          <button
            type="button"
            onClick={() => onSelectTime({ ...selectedTime, period: 'AM' })}
            style={{
              padding: "14px 8px",
              borderRadius: 12,
              border: selectedTime.period === 'AM'
                ? "2px solid #8b5cf6"
                : "1px solid rgba(255,255,255,0.1)",
              background: selectedTime.period === 'AM'
                ? "rgba(139, 92, 246, 0.2)"
                : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => onSelectTime({ ...selectedTime, period: 'PM' })}
            style={{
              padding: "14px 8px",
              borderRadius: 12,
              border: selectedTime.period === 'PM'
                ? "2px solid #8b5cf6"
                : "1px solid rgba(255,255,255,0.1)",
              background: selectedTime.period === 'PM'
                ? "rgba(139, 92, 246, 0.2)"
                : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 32 }}>
      <label style={{
        display: "block",
        marginBottom: 12,
        fontSize: 15,
        fontWeight: 600,
        color: "rgba(255,255,255,0.9)",
      }}>
        {title}
      </label>
      {children}
    </div>
  );
}

function TypeButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 8px",
        borderRadius: 12,
        border: selected
          ? "2px solid #8b5cf6"
          : "1px solid rgba(255,255,255,0.1)",
        background: selected
          ? "rgba(139, 92, 246, 0.2)"
          : "rgba(255,255,255,0.05)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}