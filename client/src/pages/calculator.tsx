import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatIndianCurrency } from "@/lib/utils";
import { TrendingDown, ArrowRight, Calendar, IndianRupee, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AmortizationRow {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  outstanding: number;
}

interface PrepaymentResult {
  new_emi: number | null;
  new_tenure_months: number | null;
  interest_saved: number;
  tenure_reduced: number | null;
  new_closure_date: string | null;
  amortization_before: AmortizationRow[];
  amortization_after: AmortizationRow[];
}

export default function Calculator() {
  // Form state
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [remainingTenure, setRemainingTenure] = useState(180);
  const [prepaymentAmount, setPrepaymentAmount] = useState(200000);
  const [strategy, setStrategy] = useState<"reduce_emi" | "reduce_tenure">("reduce_tenure");
  const [calculationKey, setCalculationKey] = useState(0);

  // Calculate EMI
  const monthlyRate = interestRate / 12 / 100;
  const emiAmount = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, remainingTenure)) / 
                    (Math.pow(1 + monthlyRate, remainingTenure) - 1);

  // Fetch calculation from backend (refetch when calculationKey changes)
  const { data: result, isLoading } = useQuery<PrepaymentResult>({
    queryKey: ['/api/calculator/prepayment', calculationKey],
    enabled: calculationKey > 0 && loanAmount > 0 && prepaymentAmount > 0,
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/calculator/prepayment', {
        loan_amount: loanAmount,
        interest_rate: interestRate,
        remaining_tenure_months: remainingTenure,
        emi_amount: emiAmount,
        prepayment_amount: prepaymentAmount,
        strategy,
      });
      return response.json();
    }
  });

  // Use backend result if available, otherwise use client-side calculation
  const newEmi = result?.new_emi ?? emiAmount;
  const newTenure = result?.new_tenure_months ?? remainingTenure;
  const interestSaved = result?.interest_saved ?? 0;

  // Chart data
  const comparisonData = result
    ? result.amortization_before.slice(0, 12).map((row, index) => ({
        month: `M${row.month}`,
        before: Math.round(row.outstanding),
        after: Math.round(result.amortization_after[index]?.outstanding || 0),
      }))
    : [];

  // Calculate pie chart data from actual amortization schedules
  const pieData = result
    ? [
        { 
          name: "Principal Paid", 
          value: Math.round(result.amortization_after.reduce((sum, row) => sum + row.principal, 0)), 
          color: "#3b82f6" 
        },
        { 
          name: "Interest Paid", 
          value: Math.round(result.amortization_after.reduce((sum, row) => sum + row.interest, 0)), 
          color: "#10b981" 
        },
        { 
          name: "Prepayment", 
          value: prepaymentAmount, 
          color: "#8b5cf6" 
        },
      ]
    : [
        { name: "Principal", value: loanAmount - prepaymentAmount, color: "#3b82f6" },
        { name: "Interest", value: Math.max(0, interestSaved), color: "#10b981" },
        { name: "Prepayment", value: prepaymentAmount, color: "#8b5cf6" },
      ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display" data-testid="text-calculator-heading">
          Prepayment Calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          Calculate your interest savings and see the impact of prepayment
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Loan Amount</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="font-mono"
                    data-testid="input-loan-amount"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatIndianCurrency(loanAmount, 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interest Rate (% p.a.)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="font-mono"
                  data-testid="input-interest-rate"
                />
              </div>

              <div className="space-y-2">
                <Label>Remaining Tenure (months)</Label>
                <Input
                  type="number"
                  value={remainingTenure}
                  onChange={(e) => setRemainingTenure(Number(e.target.value))}
                  className="font-mono"
                  data-testid="input-tenure"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.floor(remainingTenure / 12)} years {remainingTenure % 12} months
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current EMI</span>
                  <span className="text-2xl font-mono font-bold text-primary" data-testid="text-current-emi">
                    {formatIndianCurrency(emiAmount, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prepayment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Prepayment Amount</Label>
                  <span className="text-sm font-mono font-medium">
                    {formatIndianCurrency(prepaymentAmount, 0)}
                  </span>
                </div>
                <Slider
                  value={[prepaymentAmount]}
                  onValueChange={(value) => setPrepaymentAmount(value[0])}
                  min={10000}
                  max={1000000}
                  step={10000}
                  className="mt-2"
                  data-testid="slider-prepayment"
                />
              </div>

              <div className="space-y-2">
                <Label>Strategy</Label>
                <Tabs value={strategy} onValueChange={(v) => setStrategy(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reduce_emi" data-testid="tab-reduce-emi">
                      Reduce EMI
                    </TabsTrigger>
                    <TabsTrigger value="reduce_tenure" data-testid="tab-reduce-tenure">
                      Reduce Tenure
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  {strategy === "reduce_emi" 
                    ? "Lower your monthly payment, keep the same end date"
                    : "Pay off your loan faster, keep the same monthly payment"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-6">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-500" />
                Interest Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold font-mono text-green-600 mb-2" data-testid="text-interest-saved">
                  {formatIndianCurrency(interestSaved, 0)}
                </div>
                <p className="text-muted-foreground">Total interest saved</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {strategy === "reduce_emi" ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">New EMI</p>
                      <p className="text-xl font-mono font-bold" data-testid="text-new-emi">
                        {formatIndianCurrency(newEmi, 0)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        ↓ {formatIndianCurrency(emiAmount - newEmi, 0)} less
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tenure</p>
                      <p className="text-xl font-mono font-bold">
                        {Math.floor(remainingTenure / 12)}y {remainingTenure % 12}m
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Unchanged</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">EMI Amount</p>
                      <p className="text-xl font-mono font-bold">
                        {formatIndianCurrency(emiAmount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Unchanged</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">New Tenure</p>
                      <p className="text-xl font-mono font-bold" data-testid="text-new-tenure">
                        {Math.floor(newTenure / 12)}y {Math.ceil(newTenure % 12)}m
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        ↓ {Math.floor((remainingTenure - newTenure) / 12)}y {Math.ceil((remainingTenure - newTenure) % 12)}m less
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {comparisonData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Payoff Timeline</CardTitle>
                <CardDescription>Compare outstanding balance month-by-month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                    <Tooltip formatter={(value: any) => formatIndianCurrency(value, 0)} />
                    <Legend />
                    <Bar dataKey="before" name="Without Prepayment" fill="#ef4444" />
                    <Bar dataKey="after" name="With Prepayment" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Interest vs Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: any) => formatIndianCurrency(value, 0)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12" 
            size="lg" 
            onClick={() => setCalculationKey(prev => prev + 1)}
            disabled={isLoading}
            data-testid="button-calculate-prepayment"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5 mr-2" />
                Calculate Detailed Impact
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Amortization Schedule - Full Table */}
      {result && result.amortization_after && (
        <>
          <Card data-testid="card-outstanding-chart">
            <CardHeader>
              <CardTitle>Outstanding Principal Over Time</CardTitle>
              <CardDescription>Compare loan balance with and without prepayment (First 12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                  <Tooltip
                    formatter={(value: number) => formatIndianCurrency(value, 0)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="before"
                    stroke="#ef4444"
                    name="Without Prepayment"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="after"
                    stroke="#10b981"
                    name="With Prepayment"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-amortization-schedule">
            <CardHeader>
              <CardTitle>Complete Amortization Schedule</CardTitle>
              <CardDescription>Month-by-month breakdown after prepayment (First 12 months shown)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Month</th>
                      <th className="text-right p-2 font-medium">Date</th>
                      <th className="text-right p-2 font-medium">EMI</th>
                      <th className="text-right p-2 font-medium">Principal</th>
                      <th className="text-right p-2 font-medium">Interest</th>
                      <th className="text-right p-2 font-medium">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortization_after.slice(0, 24).map((row) => (
                      <tr 
                        key={row.month} 
                        className="border-b hover-elevate" 
                        data-testid={`row-month-${row.month}`}
                      >
                        <td className="p-2">{row.month}</td>
                        <td className="text-right p-2 text-muted-foreground">
                          {new Date(row.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                        </td>
                        <td className="text-right p-2 font-mono">
                          {formatIndianCurrency(row.emi, 0)}
                        </td>
                        <td className="text-right p-2 font-mono text-blue-600">
                          {formatIndianCurrency(row.principal, 0)}
                        </td>
                        <td className="text-right p-2 font-mono text-red-600">
                          {formatIndianCurrency(row.interest, 0)}
                        </td>
                        <td className="text-right p-2 font-mono font-semibold">
                          {formatIndianCurrency(row.outstanding, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {result.amortization_after.length > 24 && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-sm text-muted-foreground">
                          Showing first 24 months of {result.amortization_after.length} total months
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
