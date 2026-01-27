import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

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

    setInitialized(true);
  }, []);

  const login = (token) => {
    localStorage.setItem("access_token", token);
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser({
      id: payload.sub,
      role: payload.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        initialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
