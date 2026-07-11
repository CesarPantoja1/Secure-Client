import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "../utils/apiRequest";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // true while checking initial session

  /**
   * Verify existing session via GET /api/me.
   * Called once on mount to restore session from httpOnly cookies.
   */
  const checkAuth = useCallback(async () => {
    try {
      const data = await apiRequest("/api/me");
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log in with email and password.
   * @returns {Promise<object>} Resolved with server response on success
   * @throws {ApiError} On failure (re-thrown so the caller can display errors)
   */
  const login = useCallback(async (email, password) => {
    const data = await apiRequest("/api/login", {
      method: "POST",
      body: { email, password },
    });
    // After login, fetch the user profile
    await checkAuth();
    return data;
  }, [checkAuth]);

  /**
   * Placeholder logout — clears local state.
   * A real implementation would call a /api/logout endpoint.
   */
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // On first mount, check for existing session
  useEffect(() => {
    // eslint-disable-next-line
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{ user, role: user?.role, isAuthenticated, loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
