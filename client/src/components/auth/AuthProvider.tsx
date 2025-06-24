import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("authToken");
  });
  
  const queryClient = useQueryClient();

  // Get current user
  const { data: authResponse, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  const user = (authResponse as AuthResponse | undefined)?.user || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Logout function
  const logout = async () => {
    try {
      // Always clear local state first for immediate UI feedback
      localStorage.removeItem("authToken");
      setIsAuthenticated(false);
      queryClient.clear();
      
      // Then notify server (doesn't require auth)
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      // Local state already cleared, so logout is still successful
      console.warn("Server logout notification failed:", error);
    }
  };

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };

  const value = {
    user: user || null,
    login,
    register,
    logout,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
