import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 1. Define your base URL using the environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Track login timestamp to prevent 401 redirects immediately after login
let lastLoginTimestamp = 0;
const LOGIN_GRACE_PERIOD_MS = 5000; // 5 seconds grace period after login

export function markLoginSuccess() {
  lastLoginTimestamp = Date.now();
}

function shouldRedirectOn401(): boolean {
  // Don't redirect if we just logged in (within grace period)
  const timeSinceLogin = Date.now() - lastLoginTimestamp;
  return timeSinceLogin > LOGIN_GRACE_PERIOD_MS;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // 2. Prepend the base URL for mutations (login, register, logout, etc.)
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // On 401, redirect to login (only if not in login grace period)
  if (res.status === 401 && !url.includes('/auth/') && window.location.pathname !== '/login') {
    if (shouldRedirectOn401()) {
      window.location.href = '/login';
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = queryKey.join("/") as string;
      
      // 3. Prepend the base URL for queries
      const fullUrl = `${API_BASE_URL}${url}`;

      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Only redirect on 401 if not in login grace period
      if (res.status === 401 && !url.includes('/auth/') && window.location.pathname !== '/login') {
        if (shouldRedirectOn401()) {
          window.location.href = '/login';
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});