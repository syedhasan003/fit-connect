import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import AuthLayout from "./components/layout/AuthLayout";

import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import WorkoutBuilder from "./screens/WorkoutBuilder";
import Diet from "./screens/Diet";
import Login from "./screens/Login";
import Register from "./screens/Register";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discovery />} />
          <Route path="/central" element={<Central />} />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />

          {/* Protected */}
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <Vault />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workout-builder"
            element={
              <ProtectedRoute>
                <WorkoutBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet/*"
            element={
              <ProtectedRoute>
                <Diet />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
