import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Profile from "./screens/Profile";
import Vault from "./screens/Vault";
import WorkoutBuilder from "./screens/WorkoutBuilder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discovery />} />
        <Route path="/central" element={<Central />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workout-builder" element={<WorkoutBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}
