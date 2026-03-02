import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AgentProvider } from "./context/AgentContext";
import AgentToast from "./components/agent/AgentToast";

import AuthLayout from "./components/layout/AuthLayout";

// Screens
import Home from "./screens/Home";
import Discovery from "./screens/Discovery";
import Central from "./screens/Central";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import WorkoutBuilder from "./screens/WorkoutBuilder";
import DietBuilder from "./screens/DietBuilder";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Onboarding from "./screens/Onboarding";
// HealthRecords deferred — import ready for when Phase 4 health records work begins
// import HealthRecords from "./screens/HealthRecords";

// Vault sub-routes
import HealthTimeline from "./screens/HealthTimeline";
import CentralAnswersList from "./screens/CentralAnswers/CentralAnswersList";
import CentralAnswerDetail from "./screens/CentralAnswers/CentralAnswerDetail";
import ManualWorkoutsList from "./screens/ManualWorkouts/ManualWorkoutsList";
import ManualWorkoutDetail from "./screens/ManualWorkouts/ManualWorkoutDetail";
import DietPlansList from "./screens/DietPlans/DietPlansList";

// ✅ REMINDERS ROUTES
import Reminders from "./screens/Reminders";
import CreateReminder from "./screens/Reminders/CreateReminder";
import EditReminder from "./screens/Reminders/EditReminder";
import MedicationToday from "./screens/Reminders/MedicationToday";

// ✅ NEW: Tracking Screens
import WorkoutTracking from "./screens/WorkoutTracking";
import MealLogging from "./screens/MealLogging";

// ✅ Weekly Progress
import WeeklyProgress from "./screens/WeeklyProgress";

// ✅ Phase 4: Exercise Library + Exercise Detail
import ExerciseLibrary from "./screens/ExerciseLibrary";
import ExerciseDetail  from "./screens/ExerciseDetail";

// ✅ Phase 4: Medication History
import MedicationHistory from "./screens/Reminders/MedicationHistory";


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

      {/* ---------------- ONBOARDING (protected, no nav) ---------------- */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
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

      {/* ⏸️ HEALTH RECORDS — deferred, route removed until Phase is built */}
      {/* <Route path="/vault/health-records" element={<ProtectedRoute><HealthRecords /></ProtectedRoute>} /> */}

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

      {/* ✅ MANUAL WORKOUTS ROUTES */}
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

      {/* ✅ DIET PLANS VAULT */}
      <Route
        path="/vault/diets"
        element={
          <ProtectedRoute>
            <DietPlansList />
          </ProtectedRoute>
        }
      />

      {/* ✅ REMINDERS ROUTES */}
      <Route
        path="/reminders"
        element={
          <ProtectedRoute>
            <Reminders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reminders/create"
        element={
          <ProtectedRoute>
            <CreateReminder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reminders/edit/:id"
        element={
          <ProtectedRoute>
            <EditReminder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reminders/medication-today"
        element={
          <ProtectedRoute>
            <MedicationToday />
          </ProtectedRoute>
        }
      />

      {/* ✅ WORKOUT & DIET ROUTES */}
      <Route
        path="/workout-builder"
        element={
          <ProtectedRoute>
            <WorkoutBuilder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/diet-builder"
        element={
          <ProtectedRoute>
            <DietBuilder />
          </ProtectedRoute>
        }
      />

      {/* ✅ NEW: TRACKING ROUTES */}
      <Route
        path="/workout-tracking"
        element={
          <ProtectedRoute>
            <WorkoutTracking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/meal-logging"
        element={
          <ProtectedRoute>
            <MealLogging />
          </ProtectedRoute>
        }
      />

      {/* ✅ WEEKLY PROGRESS */}
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <WeeklyProgress />
          </ProtectedRoute>
        }
      />

      {/* ✅ PHASE 4: EXERCISE LIBRARY & DETAIL */}
      <Route
        path="/exercise-library"
        element={
          <ProtectedRoute>
            <ExerciseLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/:id"
        element={
          <ProtectedRoute>
            <ExerciseDetail />
          </ProtectedRoute>
        }
      />

      {/* ✅ PHASE 4: MEDICATION HISTORY */}
      <Route
        path="/reminders/medication-history"
        element={
          <ProtectedRoute>
            <MedicationHistory />
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
        {/* AgentProvider owns the WebSocket + shared agent state */}
        <AgentProvider>
          <AgentToast />
          <AppRoutes />
        </AgentProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}