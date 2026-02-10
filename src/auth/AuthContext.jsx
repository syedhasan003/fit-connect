import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // ✅ FIXED: Check both 'token' and 'access_token' for backwards compatibility
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub,
          role: payload.role,
        });
        
        // ✅ Ensure token is stored in both keys for compatibility
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
        
        console.log("✅ User authenticated:", { id: payload.sub, role: payload.role });
      } catch (err) {
        console.error("❌ Token decode failed:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        setUser(null);
      }
    }

    setInitialized(true);
  }, []);

  const login = (token) => {
    console.log("🔐 Login called with token");
    
    // ✅ CRITICAL FIX: Save to BOTH 'token' AND 'access_token'
    localStorage.setItem("token", token);
    localStorage.setItem("access_token", token);
    
    console.log("💾 Token saved to localStorage (both keys)");
    
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.sub,
        role: payload.role,
      });
      console.log("✅ User set:", { id: payload.sub, role: payload.role });
    } catch (err) {
      console.error("❌ Failed to decode token:", err);
    }
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    
    // ✅ Remove both keys
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    
    setUser(null);
    console.log("✅ User logged out");
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