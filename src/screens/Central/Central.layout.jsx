import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { askCentral } from "../../api/ai";
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
  const messagesEndRef = useRef(null);

  // Handle preset from other pages
  useEffect(() => {
    if (location.state?.preset) {
      handleSubmit(location.state.preset);
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (question) => {
    if (!question.trim() || loading) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: question },
    ]);
    
    setLoading(true);

    try {
      const response = await askCentral(question);
      
      if (!response || !response.answer) {
        throw new Error("No answer received from API");
      }

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: response.answer },
      ]);
    } catch (error) {
      console.error("[CENTRAL] Error:", error);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "error",
          content: `Failed to get response: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Central</h1>
          <p style={{ opacity: 0.5, fontSize: 14, marginTop: 2 }}>
            Your personal fitness assistant
          </p>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            opacity: 0.7,
            letterSpacing: 1,
          }}
        >
          AI
        </span>
      </div>

      {/* ─── SCROLLABLE BODY ─── */}
      <div 
        className="flex-1 overflow-y-auto px-6"
        style={{
          paddingBottom: "220px",  // ✨ INCREASED: Much more space for input + nav
        }}
      >
        {/* EMPTY STATE */}
        {!hasMessages && (
          <div className="flex flex-col items-center mt-4 space-y-6">
            <GlowingOrb loading={loading} />

            <div
              className="w-full rounded-2xl px-5 py-5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 500 }}>
                What would you like to do?
              </h2>
              <p style={{ opacity: 0.5, marginTop: 6, fontSize: 14 }}>
                I can plan, adjust, and guide your training and nutrition.
              </p>
            </div>

            <Suggestions onSelect={handleSubmit} />
            <TodaysInsight />
          </div>
        )}

        {/* MESSAGE HISTORY */}
        {hasMessages && (
          <div className="mt-6">
            <MessageHistory messages={messages} loading={loading} />
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </div>
        )}
      </div>

      {/* ─── FIXED INPUT ─── */}
      <CentralInput onSubmit={handleSubmit} disabled={loading} />

      {/* ─── BOTTOM NAV ─── */}
      <BottomNav />
    </div>
  );
}