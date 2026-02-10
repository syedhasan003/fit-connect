import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import AuthLayout from "./components/layout/AuthLayout";

// Screens
import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import WorkoutBuilder from "./screens/WorkoutBuilder";
import Diet from "./screens/Diet";
import Login from "./screens/Login";
import Register from "./screens/Register";

// Vault sub-routes
import HealthTimeline from "./screens/HealthTimeline";
import CentralAnswersList from "./screens/CentralAnswers/CentralAnswersList";
import CentralAnswerDetail from "./screens/CentralAnswers/CentralAnswerDetail";
import ManualWorkoutsList from "./screens/ManualWorkouts/ManualWorkoutsList";
import ManualWorkoutDetail from "./screens/ManualWorkouts/ManualWorkoutDetail";

function AppRoutes() {
  const { isAuthenticated, initialized } = useAuth();

  // Prevent flashing before auth state loads
  if (!initialized) return null;

  return (
    <Routes>
      {/* ---------------- AUTH ---------------- */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/home" />
          ) : (
            <AuthLayout>
              <Login />
            </AuthLayout>
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/home" />
          ) : (
            <AuthLayout>
              <Register />
            </AuthLayout>
          )
        }
      />

      {/* ---------------- PROTECTED ---------------- */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <Discovery />
          </ProtectedRoute>
        }
      />

      <Route
        path="/central"
        element={
          <ProtectedRoute>
            <Central />
          </ProtectedRoute>
        }
      />

      {/* ✅ VAULT MAIN */}
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <Vault />
          </ProtectedRoute>
        }
      />

      {/* ✅ VAULT SUB-ROUTES */}
      <Route
        path="/vault/health-timeline"
        element={
          <ProtectedRoute>
            <HealthTimeline />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vault/central"
        element={
          <ProtectedRoute>
            <CentralAnswersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vault/central/:id"
        element={
          <ProtectedRoute>
            <CentralAnswerDetail />
          </ProtectedRoute>
        }
      />

      {/* ✅ NEW: MANUAL WORKOUTS ROUTES */}
      <Route
        path="/vault/workouts"
        element={
          <ProtectedRoute>
            <ManualWorkoutsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vault/workouts/:id"
        element={
          <ProtectedRoute>
            <ManualWorkoutDetail />
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

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ---------------- DEFAULT ---------------- */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/home" : "/login"} />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}