import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./screens/Home/Home";
import Coach from "./screens/Coach/Coach";
import Feed from "./screens/Feed/Feed";
import Profile from "./screens/Profile/Profile";
import BottomNav from "./components/navigation/BottomNav";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-900 text-slate-100">
        <header className="hidden" /> {/* optional top nav later */}
        <main className="pb-28"> {/* bottom nav height spacing */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}
