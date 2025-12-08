import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  subscription_tier: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isBootstrapped: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  // Fetch current logged-in user
  const {
    data: user,
    isLoading,
    isFetching,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (res.status === 401) return null; // Not logged in
        if (!res.ok) throw new Error("Failed to fetch user");

        return await res.json();
      } catch (err) {
        return null;
      }
    },

    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Bootstrap completed when first auth check finishes
  useEffect(() => {
    if (!isLoading && !isFetching) {
      setIsBootstrapped(true);
    }
  }, [isLoading, isFetching]);

  // LOGIN MUTATION
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
      }

      return res.json();
    },

    onSuccess: (userData) => {
      // Immediately set current user
      queryClient.setQueryData(["/api/auth/me"], userData);

      // Bootstrap is fully ready after login
      setIsBootstrapped(true);

      // Optional delayed invalidate (no refetch)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/auth/me"],
          refetchType: "none",
        });
      }, 150);
    },
  });

  // REGISTER MUTATION
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: async (_, variables) => {
      await loginMutation.mutateAsync({
        email: variables.email,
        password: variables.password,
      });
    },
  });

  // LOGOUT MUTATION
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isBootstrapped,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
