import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import { tokenStorage } from "@/services/token-storage";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!tokenStorage.isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        tokenStorage.clear();
        setUser(null);
      }
      // Network/server errors: keep existing session state, don't log out the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login({ email, password });
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
