import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import LoanDetail from "@/pages/loan-detail";
import AddLoan from "@/pages/add-loan";
import Calculator from "@/pages/calculator";
import Chat from "@/pages/chat";
import Reports from "@/pages/reports";
import Rates from "@/pages/rates";
import Admin from "@/pages/admin";
import Negotiations from "@/pages/negotiations";
import NegotiationsNew from "@/pages/negotiations-new";
import NegotiationDetail from "@/pages/negotiation-detail";
import AdminNegotiations from "@/pages/admin-negotiations";
import AdminNotificationsSend from "@/pages/admin-notifications-send";
import { Loader2 } from "lucide-react";

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading, isBootstrapped } = useAuth();

  // CRITICAL FIX: Wait for auth bootstrap before making routing decisions
  // This prevents redirect loops during initial auth check
  if (!isBootstrapped || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only redirect after bootstrap is complete
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading, isBootstrapped, user } = useAuth();

  // CRITICAL FIX: Wait for auth bootstrap before making routing decisions
  if (!isBootstrapped || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only redirect after bootstrap is complete
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/loans/add">
        <ProtectedRoute component={AddLoan} />
      </Route>

      <Route path="/loans/:id">
        <ProtectedRoute component={LoanDetail} />
      </Route>

      <Route path="/calculator">
        <ProtectedRoute component={Calculator} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/rates">
        <ProtectedRoute component={Rates} />
      </Route>
      <Route path="/negotiations/new">
        <ProtectedRoute component={NegotiationsNew} />
      </Route>
      <Route path="/negotiations/:id">
        <ProtectedRoute component={NegotiationDetail} />
      </Route>
      <Route path="/negotiations">
        <ProtectedRoute component={Negotiations} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <AdminRoute component={Admin} />
      </Route>
      <Route path="/admin/negotiations">
        <AdminRoute component={AdminNegotiations} />
      </Route>
      <Route path="/admin/notifications/send">
        <AdminRoute component={AdminNotificationsSend} />
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <AIChatWidget />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
