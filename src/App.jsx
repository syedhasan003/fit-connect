import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import WorkoutBuilder from "./screens/WorkoutBuilder";
import Diet from "./screens/Diet";

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
        <Route path="/diet/*" element={<Diet />} />
      </Routes>
    </BrowserRouter>
  );
}
