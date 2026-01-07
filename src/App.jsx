import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import GymDetail from "./screens/GymDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/gym/:gymId" element={<GymDetail />} />
          <Route path="/central" element={<Central />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
