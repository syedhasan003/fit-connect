import { useState } from "react";
import "./Central.css";

import Header from "../../components/central/Header";
import PrimaryPrompt from "../../components/central/PrimaryPrompt";
import Suggestions from "../../components/central/Suggestions";
import InsightCard from "../../components/central/InsightCard";
import OrbSlot from "../../components/central/OrbSlot";
import CentralInput from "../../components/central/CentralInput";

import { askCentral } from "../../api/ai";

export default function CentralLayout() {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);

  const handleSubmit = async (text) => {
    if (!text || !text.trim()) return;

    try {
      setLoading(true);
      setAnswer(null);

      const res = await askCentral(text);

      console.log("[CENTRAL_RESPONSE]", res);

      setAnswer({
        type: "message",
        content: res.answer,
      });
    } catch (err) {
      console.error("[CENTRAL_ERROR]", err);
      setAnswer({
        type: "error",
        content: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="central-page">
      <Header />
      <PrimaryPrompt />
      <Suggestions />

      <OrbSlot loading={loading} />

      <InsightCard answer={answer} loading={loading} />

      <CentralInput onSubmit={handleSubmit} disabled={loading} />
    </div>
  );
}
