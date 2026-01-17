import { Routes, Route, Navigate } from "react-router-dom";
import DietHome from "./DietHome";
import DietLog from "./DietLog";
import DietCalendar from "./DietCalendar";

export default function Diet() {
  return (
    <Routes>
      <Route index element={<DietHome />} />
      <Route path="log" element={<DietLog />} />
      <Route path="calendar" element={<DietCalendar />} />
      <Route path="*" element={<Navigate to="/diet" replace />} />
    </Routes>
  );
}
