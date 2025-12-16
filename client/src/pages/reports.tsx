import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Share2,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Building2,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChartIcon,
  Briefcase,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin-layout";
import { exportAdminReportPDF, exportUserReportPDF } from "@/lib/pdf-export";

interface ReportData {
  id: number;
  report_type: string;
  period: string;
  total_prepayments: number;
  total_interest_saved: number;
  total_tenure_reduced_months: number;
  ai_narrative: string;
  report_data: {
    portfolio: Array<{
      bank_name: string;
      loan_amount: number;
      outstanding: number;
      paid_off: number;
      interest_rate: number;
      emi_amount: number;
      remaining_months: number;
      is_active: boolean;
    }>;
    totals: {
      total_outstanding: number;
      total_paid_off: number;
      total_loan_amount: number;
      completion_percentage: number;
    };
    strategy_breakdown: {
      reduce_emi: { count: number; amount: number; savings: number };
      reduce_tenure: {
        count: number;
        amount: number;
        savings: number;
        months_saved: number;
      };
    };
    monthly_prepayments: Array<{
      date: string;
      amount: number;
      savings: number;
      strategy: string;
    }>;
  };
  generated_at: string;
}

interface Summary {
  lifetime: {
    total_prepayments: number;
    total_interest_saved: number;
    total_tenure_reduced_months: number;
    prepayment_count: number;
  };
  portfolio: {
    total_loan_amount: number;
    total_outstanding: number;
    total_paid: number;
    completion_percentage: number;
    active_loans: number;
    total_loans: number;
  };
}

interface AdminPlatformReport {
  kpis: {
    total_aum: number;
    total_loan_amount: number;
    total_interest_saved: number;
    prepayment_interest_saved: number;
    negotiation_interest_saved: number;
    avg_loan_rate: number;
    active_loans: number;
    users_with_loans: number;
  };
  bank_distribution: Array<{
    bank_name: string;
    total_outstanding: number;
    loan_count: number;
  }>;
  negotiation_performance: {
    total_processed: number;
    approved: number;
    rejected: number;
    pending: number;
    success_rate: number;
    avg_rate_reduction: number;
  };
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const BANK_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatLakhs = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return formatCurrency(amount);
};

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [reportType, setReportType] = useState<"monthly" | "annual">("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Get current period based on report type
  const getCurrentPeriod = () => {
    const now = new Date();
    if (reportType === "monthly") {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    return String(now.getFullYear());
  };

  const period = selectedPeriod || getCurrentPeriod();

  // === QUERIES ====================================================

  // Admin Platform Report (only for admins)
  const {
    data: adminReport,
    isLoading: adminReportLoading,
  } = useQuery<AdminPlatformReport>({
    queryKey: ["admin-platform-report"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reports/admin/platform/");
      return res.json();
    },
    enabled: isAdmin,
  });

  // User Report data via apiRequest (for non-admins)
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useQuery<ReportData>({
    queryKey: ["reports", reportType, period],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/reports/generate?report_type=${reportType}&period=${period}`
      );
      return await res.json();
    },
    enabled: !isAdmin && !!period,
  });

  // Summary data via apiRequest (for non-admins)
  const {
    data: summary,
    error: summaryError,
  } = useQuery<Summary>({
    queryKey: ["reports-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reports/summary/");
      return await res.json();
    },
    enabled: !isAdmin,
  });

  // === ERROR TOASTS ===============================================

  useEffect(() => {
    if (reportError && !isAdmin) {
      toast({
        title: "Error fetching report",
        description: (reportError as Error).message,
        variant: "destructive",
      });
    }
  }, [reportError, toast, isAdmin]);

  useEffect(() => {
    if (summaryError && !isAdmin) {
      toast({
        title: "Error fetching summary",
        description: (summaryError as Error).message,
        variant: "destructive",
      });
    }
  }, [summaryError, toast, isAdmin]);

  // === HELPERS ====================================================

  const getPeriodOptions = () => {
    const options: string[] = [];
    const now = new Date();

    if (reportType === "monthly") {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const p = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        options.push(p);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        options.push(String(now.getFullYear() - i));
      }
    }

    return options;
  };

  const formatPeriod = (p: string) => {
    if (reportType === "monthly") {
      const [year, month] = p.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
    }
    return p;
  };

  const handleExportPDF = async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while we create your report...",
    });

    try {
      if (isAdmin && adminReport) {
        // Prepare admin report data
        await exportAdminReportPDF({
          title: "Platform Analytics Report",
          subtitle: "Aggregated platform metrics and performance insights",
          generatedAt: new Date(),
          isAdmin: true,
          kpis: {
            totalAUM: formatLakhs(adminReport.kpis.total_aum),
            interestSaved: formatLakhs(adminReport.kpis.total_interest_saved),
            avgRate: `${adminReport.kpis.avg_loan_rate.toFixed(2)}%`,
            activeLoans: adminReport.kpis.active_loans,
            usersWithLoans: adminReport.kpis.users_with_loans,
          },
          bankDistribution: adminReport.bank_distribution.map((bank) => ({
            name: bank.bank_name,
            value: formatLakhs(bank.total_outstanding),
            percentage: `${((bank.total_outstanding / adminReport.kpis.total_aum) * 100).toFixed(1)}%`,
          })),
          negotiationStats: {
            total: adminReport.negotiation_performance.total_processed,
            approved: adminReport.negotiation_performance.approved,
            rejected: adminReport.negotiation_performance.rejected,
            pending: adminReport.negotiation_performance.pending,
            successRate: `${adminReport.negotiation_performance.success_rate}%`,
            avgReduction: `${adminReport.negotiation_performance.avg_rate_reduction.toFixed(2)}%`,
          },
        }, "admin-charts-container");

        toast({
          title: "PDF Downloaded!",
          description: "Your admin report has been saved.",
        });
      } else if (report && summary) {
        // Prepare user report data
        await exportUserReportPDF({
          title: "Savings Report",
          subtitle: "Track your home loan savings journey",
          generatedAt: new Date(),
          isAdmin: false,
          lifetimeSavings: {
            interestSaved: formatCurrency(summary.lifetime.total_interest_saved),
            totalPrepayments: formatCurrency(summary.lifetime.total_prepayments),
            monthsSaved: summary.lifetime.total_tenure_reduced_months,
            completion: `${summary.portfolio.completion_percentage.toFixed(1)}%`,
          },
          periodData: {
            period: formatPeriod(period),
            prepayments: formatCurrency(report.total_prepayments),
            interestSaved: formatCurrency(report.total_interest_saved),
            tenureReduced: report.total_tenure_reduced_months,
          },
          aiSummary: report.ai_narrative,
        }, "user-charts-container");

        toast({
          title: "PDF Downloaded!",
          description: "Your savings report has been saved.",
        });
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareText = isAdmin
      ? `Platform Analytics: ${adminReport?.kpis.active_loans} active loans with ₹${formatLakhs(adminReport?.kpis.total_aum || 0)} AUM`
      : `I saved ${formatCurrency(report?.total_interest_saved || 0)} in home loan interest! Managing my loan smartly with Interex.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Interex Report",
          text: shareText,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share your achievement",
      });
    }
  };

  // === LOADING STATE ==============================================

  if (isAdmin && adminReportLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin && reportLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // === ADMIN VIEW =================================================

  if (isAdmin && adminReport) {
    return <AdminReportsView adminReport={adminReport} onExport={handleExportPDF} onShare={handleShare} />;
  }

  // === USER VIEW ==================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8" data-testid="page-reports">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-reports-heading">
            Savings Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your home loan savings journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleShare} data-testid="button-share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Lifetime Summary */}
      {summary && (
        <Card data-testid="card-lifetime-summary">
          <CardHeader>
            <CardTitle>Lifetime Savings</CardTitle>
            <CardDescription>Your total savings across all loans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.lifetime.total_interest_saved)}
                  </p>
                  <p className="text-sm text-muted-foreground">Interest Saved</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.lifetime.total_prepayments)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Prepayments</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.lifetime.total_tenure_reduced_months}</p>
                  <p className="text-sm text-muted-foreground">Months Saved</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.portfolio.completion_percentage.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Loan Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Type Tabs */}
      <Tabs
        value={reportType}
        onValueChange={(v) => {
          setReportType(v as "monthly" | "annual");
          setSelectedPeriod("");
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <UserReportContent
            report={report}
            reportType="monthly"
            period={period}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            periodOptions={getPeriodOptions()}
            formatPeriod={formatPeriod}
          />
        </TabsContent>

        <TabsContent value="annual" className="space-y-6">
          <UserReportContent
            report={report}
            reportType="annual"
            period={period}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            periodOptions={getPeriodOptions()}
            formatPeriod={formatPeriod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================================================================
// Admin Reports View Component
// ===================================================================

function AdminReportsView({
  adminReport,
  onExport,
  onShare,
}: {
  adminReport: AdminPlatformReport;
  onExport: () => void;
  onShare: () => void;
}) {
  const { kpis, bank_distribution, negotiation_performance } = adminReport;

  // Prepare chart data
  const bankChartData = bank_distribution.map((bank, index) => ({
    name: bank.bank_name,
    value: bank.total_outstanding,
    loans: bank.loan_count,
    fill: BANK_COLORS[index % BANK_COLORS.length],
  }));

  const negotiationChartData = [
    { name: "Approved", value: negotiation_performance.approved, fill: "#10b981" },
    { name: "Rejected", value: negotiation_performance.rejected, fill: "#ef4444" },
    { name: "Pending", value: negotiation_performance.pending, fill: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8" data-testid="page-admin-reports">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display">Platform Analytics</h1>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              Admin View
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Aggregated platform metrics and performance insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Outstanding (AUM)</p>
                <p className="text-2xl font-bold font-mono">{formatLakhs(kpis.total_aum)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Platform Interest Saved</p>
                <p className="text-2xl font-bold font-mono text-green-600">
                  {formatLakhs(kpis.total_interest_saved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Platform Avg Loan Rate</p>
                <p className="text-2xl font-bold font-mono">{kpis.avg_loan_rate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold font-mono">{kpis.active_loans}</p>
                <p className="text-xs text-muted-foreground">{kpis.users_with_loans} users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div id="admin-charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Loan Distribution by Bank
            </CardTitle>
            <CardDescription>Outstanding loan value by lending institution</CardDescription>
          </CardHeader>
          <CardContent>
            {bankChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={bankChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {bankChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatLakhs(value), "Outstanding"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No loan data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Negotiation Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Negotiation Status Breakdown
            </CardTitle>
            <CardDescription>Distribution of negotiation outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {negotiationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={negotiationChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => [value, "Count"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {negotiationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No negotiation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Negotiation Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Negotiation Performance Summary
          </CardTitle>
          <CardDescription>Admin-level negotiation metrics and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Processed</span>
                <Badge variant="outline">{negotiation_performance.total_processed}</Badge>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Success Rate
                </span>
                <Badge variant="default" className="bg-green-500">
                  {negotiation_performance.success_rate}%
                </Badge>
              </div>
              <Progress value={negotiation_performance.success_rate} className="h-2 bg-muted [&>div]:bg-green-500" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Avg Rate Reduction
                </span>
                <Badge variant="secondary">{negotiation_performance.avg_rate_reduction.toFixed(2)}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Average percentage point reduction in successful negotiations
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pending Review
                </span>
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {negotiation_performance.pending}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Negotiations awaiting admin review
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">{negotiation_performance.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{negotiation_performance.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">{negotiation_performance.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Table */}
      {bank_distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Lender Breakdown
            </CardTitle>
            <CardDescription>Detailed view of loans by lending institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                    <th>Bank</th>
                    <th className="text-right">Outstanding Value</th>
                    <th className="text-right">Loan Count</th>
                    <th className="text-right">% of AUM</th>
                  </tr>
                </thead>
                <tbody>
                  {bank_distribution.map((bank, index) => {
                    const aumPercentage = kpis.total_aum > 0
                      ? (bank.total_outstanding / kpis.total_aum * 100).toFixed(1)
                      : "0";
                    return (
                      <tr
                        key={bank.bank_name}
                        className="[&>td]:px-4 [&>td]:py-3 border-t hover:bg-muted/50 transition-colors"
                      >
                        <td className="font-medium flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: BANK_COLORS[index % BANK_COLORS.length] }}
                          />
                          {bank.bank_name}
                        </td>
                        <td className="text-right font-mono">{formatLakhs(bank.total_outstanding)}</td>
                        <td className="text-right">{bank.loan_count}</td>
                        <td className="text-right">
                          <Badge variant="outline">{aumPercentage}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  );
}

// ===================================================================
// User Report Content Component
// ===================================================================

function UserReportContent({
  report,
  reportType,
  period,
  selectedPeriod,
  setSelectedPeriod,
  periodOptions,
  formatPeriod,
}: {
  report: ReportData | undefined;
  reportType: string;
  period: string;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  periodOptions: string[];
  formatPeriod: (period: string) => string;
}) {
  if (!report) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        No data available for this period
      </div>
    );
  }

  const portfolioChartData = report.report_data.portfolio.map((loan) => ({
    name: loan.bank_name,
    outstanding: loan.outstanding,
    paidOff: loan.paid_off,
  }));

  const strategyData = [
    { name: "Reduce EMI", value: report.report_data.strategy_breakdown.reduce_emi.amount || 0 },
    { name: "Reduce Tenure", value: report.report_data.strategy_breakdown.reduce_tenure.amount || 0 },
  ].filter((item) => item.value > 0);

  return (
    <>
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Select value={selectedPeriod || period} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {formatPeriod(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Prepayments</p>
                <p className="text-3xl font-bold font-mono">
                  {formatCurrency(report.total_prepayments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Interest Saved</p>
                <p className="text-3xl font-bold font-mono text-green-600">
                  {formatCurrency(report.total_interest_saved)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Tenure Reduced</p>
                <p className="text-3xl font-bold font-mono">
                  {report.total_tenure_reduced_months} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {report.ai_narrative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{report.ai_narrative}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div id="user-charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portfolioChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Loan Portfolio</CardTitle>
              <CardDescription>Outstanding vs Paid Off</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="outstanding" fill={COLORS[0]} name="Outstanding" />
                  <Bar dataKey="paidOff" fill={COLORS[1]} name="Paid Off" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {strategyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Prepayment Strategy</CardTitle>
              <CardDescription>Distribution by strategy type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={strategyData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => formatCurrency(entry.value)}
                  >
                    {strategyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prepayment Timeline */}
      {report.report_data.monthly_prepayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prepayment Timeline</CardTitle>
            <CardDescription>Your prepayment activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.report_data.monthly_prepayments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke={COLORS[0]} name="Prepayment Amount" />
                <Line type="monotone" dataKey="savings" stroke={COLORS[2]} name="Interest Saved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
