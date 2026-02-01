import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { askCentral } from "../../api/ai";
import { logEvent } from "../../api/events";
import GlowingOrb from "../../components/central/GlowingOrb";
import Suggestions from "../../components/central/Suggestions";
import TodaysInsight from "../../components/central/TodaysInsight";
import MessageHistory from "../../components/central/MessageHistory";
import CentralInput from "../../components/central/CentralInput";
import BottomNav from "../../components/navigation/BottomNav";

export default function CentralLayout() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Preset question from another page (e.g. Home → "Create a diet plan")
  useEffect(() => {
    if (location.state?.preset) {
      submit(location.state.preset);
    }
  }, []);

  // Auto-scroll to bottom whenever messages or loading changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const submit = async (question) => {
    if (!question.trim() || loading) return;

    // Log that the user asked something
    logEvent("central_question_asked", { question }).catch(() => {});

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: question },
    ]);
    setLoading(true);

    try {
      const res = await askCentral(question);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: res.answer },
      ]);
      // Log successful answer
      logEvent("central_answer_received", { question, answerLength: res.answer?.length }).catch(() => {});
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "error", content: "Something went wrong. Please try again." },
      ]);
      logEvent("central_error", { question, error: err.message }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#000",
      color: "#fff",
      overflow: "hidden", // ← KEY: prevents body scroll, only inner panel scrolls
    }}>
      {/* ─── HEADER (static, never scrolls) ─── */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "56px 24px 12px",
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Central</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
            Your personal fitness assistant
          </p>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: "rgba(255,255,255,0.5)",
        }}>AI</span>
      </div>

      {/* ─── SCROLLABLE BODY (this is the ONLY scroll container) ─── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px",
          paddingBottom: 90, // space for input + nav
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* EMPTY STATE */}
        {!hasMessages && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 16 }}>
            <GlowingOrb loading={loading} />

            {/* "What would you like to do?" */}
            <div style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "#fff" }}>
                What would you like to do?
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "5px 0 0" }}>
                I can plan, adjust, and guide your training and nutrition.
              </p>
            </div>

            <div style={{ width: "100%" }}>
              <Suggestions onSelect={submit} />
            </div>

            <div style={{ width: "100%" }}>
              <TodaysInsight />
            </div>
          </div>
        )}

        {/* MESSAGE HISTORY */}
        {hasMessages && (
          <div style={{ paddingTop: 12 }}>
            <MessageHistory messages={messages} loading={loading} />
          </div>
        )}
      </div>

      {/* ─── FIXED INPUT ─── */}
      <CentralInput onSubmit={submit} disabled={loading} />

      {/* ─── BOTTOM NAV ─── */}
      <BottomNav />
    </div>
  );
}