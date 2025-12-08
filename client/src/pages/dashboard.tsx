import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Calendar,
  Bell,
  Plus,
  IndianRupee,
  ArrowRight,
  Building2,
  Loader2,
  Bot,
  Calculator,
  FileText,
} from "lucide-react";
import { formatIndianCurrency, formatReadableDate } from "@/lib/utils";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";

interface Loan {
  id: number;
  user_id: string;
  bank_name: string;
  loan_amount: number;
  outstanding_principal: number;
  interest_rate: number;
  emi_amount: number;
  tenure_months: number;
  remaining_tenure_months: number;
  start_date: string;
  next_emi_date: string | null;
  account_number: string | null;
  is_active: boolean;
  created_at: string;
}

interface Notification {
  id: number;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  subscription_tier: string;
}

export default function Dashboard() {
// Fetch current user
const { data: user } = useQuery<User>({
  queryKey: ['/auth/me'],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/auth/me");
    return res.json();
  },
});


// Fetch loans
const { data: loans = [], isLoading: loansLoading } = useQuery<Loan[]>({
  queryKey: ['/loans'],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/loans");
    return res.json();
  },
});

// Fetch notifications
const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
  queryKey: ['/notifications'],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/notifications");
    return res.json();
  },
});


  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding_principal, 0);
  const totalSavingsThisYear = 0; // TODO: Calculate from prepayments
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const userName = user?.first_name || user?.email?.split('@')[0] || 'User';

  if (loansLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-dashboard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-dashboard-heading">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-dashboard-date">
            {formatReadableDate(new Date())}
          </p>
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/chat">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-action-chat">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">AI Financial Advisor</p>
                <p className="text-sm text-muted-foreground">Get personalized advice</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/negotiations/new">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-action-negotiation">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Rate Negotiation</p>
                <p className="text-sm text-muted-foreground">Get AI-powered letters</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/calculator">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-action-calculator">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Prepayment Calculator</p>
                <p className="text-sm text-muted-foreground">Plan your savings</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-action-reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Reports & Analytics</p>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Rate Monitoring Quick Action */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Link href="/rates">
          <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-action-rates">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Rate Monitoring</p>
                <p className="text-sm text-muted-foreground">Track RBI & bank rates to optimize your loan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-stat-loans">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono" data-testid="text-total-loans">{totalLoans}</div>
            <p className="text-xs text-muted-foreground mt-1">Active home loans</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-outstanding">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Principal</CardTitle>
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono" data-testid="text-outstanding">
              {formatIndianCurrency(totalOutstanding, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all loans</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-savings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings This Year</CardTitle>
            <TrendingDown className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-green-600" data-testid="text-savings">
              {formatIndianCurrency(totalSavingsThisYear, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Interest saved</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-notifications">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono" data-testid="text-alerts">{unreadNotifications}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold font-display" data-testid="text-your-loans">Your Loans</h2>
          <Link href="/loans/add">
            <Button data-testid="button-add-loan">
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No loans yet</p>
                <p className="text-sm text-muted-foreground mb-4">Add your first home loan to get started</p>
                <Link href="/loans/add">
                  <Button data-testid="button-add-first-loan">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Loan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            loans.map((loan) => {
              const progress = ((loan.loan_amount - loan.outstanding_principal) / loan.loan_amount) * 100;
              return (
                <Card key={loan.id} className="hover-elevate transition-all" data-testid={`card-loan-${loan.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base" data-testid={`text-bank-${loan.id}`}>{loan.bank_name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {loan.interest_rate}% p.a.
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-mono font-medium" data-testid={`text-outstanding-${loan.id}`}>
                          {formatIndianCurrency(loan.outstanding_principal, 0)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress.toFixed(1)}% repaid
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Monthly EMI</span>
                        <span className="font-mono font-medium">
                          {formatIndianCurrency(loan.emi_amount, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Next EMI</span>
                        <span className="font-medium">
                          {loan.next_emi_date ? formatReadableDate(new Date(loan.next_emi_date)) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Remaining Tenure</span>
                        <span className="font-medium">
                          {Math.floor(loan.remaining_tenure_months / 12)}y {loan.remaining_tenure_months % 12}m
                        </span>
                      </div>
                    </div>

                    <Link href={`/loans/${loan.id}`}>
                      <Button variant="outline" className="w-full" data-testid={`button-view-loan-${loan.id}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-semibold font-display mb-4" data-testid="text-recent-activity">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No notifications</p>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification, idx) => (
                <div
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 hover-elevate transition-all ${
                    idx !== Math.min(5, notifications.length) - 1 ? 'border-b' : ''
                  } ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium" data-testid={`notification-title-${notification.id}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`notification-message-${notification.id}`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <Badge variant="default" className="flex-shrink-0">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatReadableDate(new Date(notification.created_at))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
