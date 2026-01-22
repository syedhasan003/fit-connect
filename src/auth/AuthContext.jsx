import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub,
          role: payload.role,
        });
      } catch {
        localStorage.removeItem("access_token");
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem("access_token", token);
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser({ id: payload.sub, role: payload.role });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
