import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import DietHome from "./DietHome";
import DietLog from "./DietLog";
import DietCalendar from "./DietCalendar";
import DietBottomNav from "./components/DietBottomNav";
import "./diet.css";

function DietLayout() {
  return (
    <>
      <Outlet />
      <DietBottomNav />
    </>
  );
}

export default function Diet() {
  return (
    <Routes>
      <Route element={<DietLayout />}>
        <Route index element={<DietHome />} />
        <Route path="log" element={<DietLog />} />
        <Route path="calendar" element={<DietCalendar />} />
      </Route>

      <Route path="*" element={<Navigate to="/diet" replace />} />
    </Routes>
  );
}
