import { Outlet } from "react-router-dom";
import BottomNav from "../navigation/BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
