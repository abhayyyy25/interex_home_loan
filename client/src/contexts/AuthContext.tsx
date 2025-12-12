import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, markLoginSuccess } from "@/lib/queryClient";

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
  // Track if user just logged in to prevent stale auth checks
  const justLoggedInRef = useRef(false);
  // Store user directly after login to prevent query race conditions
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // Fetch current logged-in user
  const {
    data: queryUser,
    isLoading,
    isFetching,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      // If user just logged in, skip the fetch and use cached data
      if (justLoggedInRef.current) {
        return loggedInUser;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      const url = `${API_BASE_URL}/api/auth/me/`;

      try {
        const res = await fetch(url, { credentials: "include" });

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

  // Use loggedInUser if available (from recent login), otherwise use query result
  const user = loggedInUser || queryUser || null;

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
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";

      const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
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
      // Mark login success to prevent 401 redirects during grace period
      markLoginSuccess();
      
      // Mark that user just logged in
      justLoggedInRef.current = true;
      
      // Store user in state immediately
      setLoggedInUser(userData);
      
      // Also set in query cache
      queryClient.setQueryData(["/api/auth/me"], userData);

      // Bootstrap is fully ready after login
      setIsBootstrapped(true);

      // Reset the justLoggedIn flag after navigation is complete
      setTimeout(() => {
        justLoggedInRef.current = false;
      }, 2000);
    },
  });

  // REGISTER MUTATION
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register/", data);
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
      await apiRequest("POST", "/api/auth/logout/");
    },
    onSuccess: () => {
      // Clear local state
      setLoggedInUser(null);
      justLoggedInRef.current = false;
      
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
