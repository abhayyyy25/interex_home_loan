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
import {
  Download,
  Share2,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  FileText,
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export default function Reports() {
  const { toast } = useToast();
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

  // Report data via apiRequest
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
    
    enabled: !!period,
  });

  // Summary data via apiRequest (NOT global queryFn)
  const {
    data: summary,
    error: summaryError,
  } = useQuery<Summary>({
    queryKey: ["reports-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reports/summary");
      return await res.json();
    },    
  });

  // === ERROR TOASTS ===============================================

  useEffect(() => {
    if (reportError) {
      toast({
        title: "Error fetching report",
        description: (reportError as Error).message,
        variant: "destructive",
      });
    }
  }, [reportError, toast]);

  useEffect(() => {
    if (summaryError) {
      toast({
        title: "Error fetching summary",
        description: (summaryError as Error).message,
        variant: "destructive",
      });
    }
  }, [summaryError, toast]);

  // === HELPERS ====================================================

  const getPeriodOptions = () => {
    const options: string[] = [];
    const now = new Date();

    if (reportType === "monthly") {
      // Last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const p = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        options.push(p);
      }
    } else {
      // Last 5 years
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

  const handleExportPDF = () => {
    if (!report) return;

    toast({
      title: "Exporting PDF",
      description: "Your report is being prepared for download...",
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Savings Report - ${formatPeriod(period)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e40af; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { color: #6b7280; margin-top: 5px; }
            .narrative { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background: #f9fafb; font-weight: 600; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Savings Report - ${formatPeriod(period)}</h1>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">₹${report.total_prepayments.toLocaleString(
                "en-IN"
              )}</div>
              <div class="stat-label">Total Prepayments</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${report.total_interest_saved.toLocaleString(
                "en-IN"
              )}</div>
              <div class="stat-label">Interest Saved</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${
                report.total_tenure_reduced_months
              } months</div>
              <div class="stat-label">Tenure Reduced</div>
            </div>
          </div>
          <div class="narrative">
            <h3>AI Summary</h3>
            <p>${report.ai_narrative}</p>
          </div>
          <h3>Loan Portfolio</h3>
          <table>
            <thead>
              <tr>
                <th>Bank</th>
                <th>Loan Amount</th>
                <th>Outstanding</th>
                <th>Paid Off</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              ${report.report_data.portfolio
                .map(
                  (loan) => `
                <tr>
                  <td>${loan.bank_name}</td>
                  <td>₹${loan.loan_amount.toLocaleString("en-IN")}</td>
                  <td>₹${loan.outstanding.toLocaleString("en-IN")}</td>
                  <td>₹${loan.paid_off.toLocaleString("en-IN")}</td>
                  <td>${loan.interest_rate}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 6px; cursor: pointer;">Print Report</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (!report) return;

    const shareText = `I saved ₹${report.total_interest_saved.toLocaleString(
      "en-IN"
    )} in home loan interest ${
      reportType === "monthly" ? "this month" : "this year"
    }! Managing my home loan smartly with Interex.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Savings Report",
          text: shareText,
        });
      } catch {
        // user cancelled, ignore
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share your achievement on social media",
      });
    }
  };

  // === LOADING STATE ==============================================

  if (reportLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // === MAIN UI ====================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8" data-testid="page-reports">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold font-display"
            data-testid="text-reports-heading"
          >
            Savings Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your home loan savings journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
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
            <CardDescription>
              Your total savings across all loans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold text-green-600"
                    data-testid="text-lifetime-interest-saved"
                  >
                    ₹{summary.lifetime.total_interest_saved.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Interest Saved
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₹{summary.lifetime.total_prepayments.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Prepayments
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summary.lifetime.total_tenure_reduced_months}
                  </p>
                  <p className="text-sm text-muted-foreground">Months Saved</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summary.portfolio.completion_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Loan Completed
                  </p>
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
          setSelectedPeriod(""); // reset to current period on type change
        }}
        data-testid="tabs-report-type"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monthly" data-testid="tab-monthly">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annual" data-testid="tab-annual">
            Annual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <ReportContent
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
          <ReportContent
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
// Child content component
// ===================================================================

function ReportContent({
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

  // Chart data
  const portfolioChartData = report.report_data.portfolio.map((loan) => ({
    name: loan.bank_name,
    outstanding: loan.outstanding,
    paidOff: loan.paid_off,
  }));

  const strategyData = [
    {
      name: "Reduce EMI",
      value: report.report_data.strategy_breakdown.reduce_emi.amount || 0,
    },
    {
      name: "Reduce Tenure",
      value: report.report_data.strategy_breakdown.reduce_tenure.amount || 0,
    },
  ].filter((item) => item.value > 0);

  return (
    <>
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Select
          value={selectedPeriod || period}
          onValueChange={setSelectedPeriod}
        >
          <SelectTrigger className="w-64" data-testid="select-period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p} value={p} data-testid={`period-${p}`}>
                {formatPeriod(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-prepayments">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Total Prepayments
                </p>
                <p
                  className="text-3xl font-bold font-mono"
                  data-testid="text-total-prepayments"
                >
                  ₹{report.total_prepayments.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-interest-saved">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Interest Saved</p>
                <p
                  className="text-3xl font-bold font-mono text-green-600"
                  data-testid="text-interest-saved"
                >
                  ₹{report.total_interest_saved.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-tenure-reduced">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Tenure Reduced</p>
                <p
                  className="text-3xl font-bold font-mono"
                  data-testid="text-tenure-reduced"
                >
                  {report.total_tenure_reduced_months} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {report.ai_narrative && (
        <Card data-testid="card-ai-narrative">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Breakdown */}
        {portfolioChartData.length > 0 && (
          <Card data-testid="card-portfolio-chart">
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
                  <Tooltip
                    formatter={(value: number) =>
                      `₹${value.toLocaleString("en-IN")}`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="outstanding"
                    fill={COLORS[0]}
                    name="Outstanding"
                  />
                  <Bar dataKey="paidOff" fill={COLORS[1]} name="Paid Off" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Strategy Breakdown */}
        {strategyData.length > 0 && (
          <Card data-testid="card-strategy-chart">
            <CardHeader>
              <CardTitle>Prepayment Strategy</CardTitle>
              <CardDescription>
                Distribution by strategy type
              </CardDescription>
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
                    label={(entry) =>
                      `₹${entry.value.toLocaleString("en-IN")}`
                    }
                  >
                    {strategyData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `₹${value.toLocaleString("en-IN")}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prepayment Timeline */}
      {report.report_data.monthly_prepayments.length > 0 && (
        <Card data-testid="card-prepayment-timeline">
          <CardHeader>
            <CardTitle>Prepayment Timeline</CardTitle>
            <CardDescription>
              Your prepayment activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.report_data.monthly_prepayments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `₹${value.toLocaleString("en-IN")}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={COLORS[0]}
                  name="Prepayment Amount"
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke={COLORS[2]}
                  name="Interest Saved"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
