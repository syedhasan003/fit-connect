import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, initialized, user } = useAuth();

  // Wait until auth state is resolved
  if (!initialized) {
    return null;
  }

  // Not logged in → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based guard (optional)
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
