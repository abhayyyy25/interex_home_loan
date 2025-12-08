import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, ArrowUpDown, Building2, Percent, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RepoRate {
  id: number;
  rate: number;
  effective_date: string;
  change_bps: number | null;
  announcement_date: string | null;
}

interface BankRate {
  id: number;
  bank_name: string;
  interest_rate: number;
  loan_amount_min: number | null;
  loan_amount_max: number | null;
  processing_fee: number | null;
  prepayment_allowed: boolean;
  prepayment_charges: string | null;
  last_updated: string;
}

interface RateComparison {
  loan_id: number;
  user_loan_rate: number;
  current_market_avg: number;
  best_available_rate: number;
  potential_annual_savings: number;
  banks_below_user_rate: BankRate[];
}

interface RateTrend {
  date: string;
  rate: number;
  change_bps?: number;
}

interface Trends {
  repo_rate_trend: RateTrend[];
  bank_rate_trends: Record<string, { date: string; rate: number }[]>;
}

export default function RatesPage() {
  const { toast } = useToast();

  const { data: repoRate, isLoading: repoLoading } = useQuery<RepoRate>({
    queryKey: ["/api/rates/repo/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rates/repo/current");
      return res.json();
    },
  });
  

  const { data: bankRates, isLoading: banksLoading } = useQuery<{ rates: BankRate[] }>({
    queryKey: ["/api/rates/banks/current"],
    queryFn: async () => {
       const res = await apiRequest("GET", "/api/rates/banks/current");
       return res.json();
      }
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery<RateComparison>({
    queryKey: ["/api/rates/comparison"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rates/comparison");
      return res.json();
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<Trends>({
    queryKey: ["/api/rates/trends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rates/trends");
      return res.json();
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-jakarta" data-testid="text-rates-heading">
            Rate Monitoring
          </h1>
          <p className="text-muted-foreground">
            Track RBI repo rates and bank interest rates to optimize your home loan
          </p>
        </div>

        <Tabs defaultValue="current" className="space-y-6" data-testid="tabs-rates">
          <TabsList data-testid="tabs-rates-list">
            <TabsTrigger value="current" data-testid="tab-current-rates">
              Current Rates
            </TabsTrigger>
            <TabsTrigger value="comparison" data-testid="tab-comparison">
              My Loan Comparison
            </TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">
              Historical Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {repoLoading ? (
              <Skeleton className="h-32" />
            ) : repoRate ? (
              <Card data-testid="card-repo-rate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        RBI Repo Rate
                      </CardTitle>
                      <CardDescription>
                        Current reserve bank policy rate
                      </CardDescription>
                    </div>
                    {repoRate.change_bps !== null && (
                      <Badge variant={repoRate.change_bps > 0 ? "destructive" : repoRate.change_bps < 0 ? "default" : "secondary"} data-testid="badge-repo-change">
                        {repoRate.change_bps === 0 ? (
                          <><ArrowUpDown className="h-3 w-3 mr-1" /> Unchanged</>
                        ) : repoRate.change_bps > 0 ? (
                          <><TrendingUp className="h-3 w-3 mr-1" /> +{repoRate.change_bps} bps</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 mr-1" /> {repoRate.change_bps} bps</>
                        )}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono text-primary" data-testid="text-repo-rate">
                      {repoRate.rate}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      as of {formatDate(repoRate.effective_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div>
              <h2 className="text-xl font-semibold mb-4 font-jakarta">
                Bank Home Loan Rates
              </h2>
              {banksLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : bankRates?.rates?.length > 0 ? (
                <div className="grid gap-4" data-testid="list-bank-rates">
                  {bankRates.rates.map((rate: any) => (
                    <Card key={rate.id} className="hover-elevate" data-testid={`card-bank-${rate.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold" data-testid={`text-bank-name-${rate.id}`}>
                                {rate.bank_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Updated {formatDate(rate.last_updated)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold font-mono" data-testid={`text-bank-rate-${rate.id}`}>
                              {rate.interest_rate}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Processing: {rate.processing_fee}%
                            </div>
                          </div>
                        </div>
                        {rate.prepayment_charges && (
                          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                            <span className="font-medium">Prepayment: </span>
                            {rate.prepayment_charges}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No bank rate data available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {comparisonLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-64" />
              </div>
            ) : comparison ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card data-testid="card-user-rate">
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Your Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono" data-testid="text-user-rate">
                        {comparison.user_loan_rate}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-market-avg">
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Market Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono" data-testid="text-market-avg">
                        {comparison.current_market_avg}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-best-rate">
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Best Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-500" data-testid="text-best-rate">
                        {comparison.best_available_rate}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-potential-savings">
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold font-mono text-green-600 dark:text-green-500" data-testid="text-potential-savings">
                        {formatCurrency(comparison.potential_annual_savings)}/yr
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {comparison.banks_below_user_rate?.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-jakarta">Banks Offering Better Rates</CardTitle>
                      <CardDescription>
                        {comparison.banks_below_user_rate.length} {comparison.banks_below_user_rate.length === 1 ? 'bank offers' : 'banks offer'} lower rates than your current loan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3" data-testid="list-better-rates">
                        {comparison.banks_below_user_rate.map((rate: any) => (
                          <div key={rate.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`card-better-rate-${rate.id}`}>
                            <div>
                              <h4 className="font-semibold">{rate.bank_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Processing: {rate.processing_fee}% • {rate.prepayment_charges}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold font-mono text-green-600 dark:text-green-500">
                                {rate.interest_rate}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(comparison.user_loan_rate - rate.interest_rate).toFixed(2)}% lower
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <p>You already have one of the best rates available!</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Add a loan to see rate comparison</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {trendsLoading ? (
              <Skeleton className="h-96" />
            ) : trends ? (
              <>
                {trends.repo_rate_trend?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-jakarta">RBI Repo Rate History</CardTitle>
                      <CardDescription>
                        Last {trends.repo_rate_trend.length} policy announcements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trends.repo_rate_trend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), "MMM yyyy")}
                            className="text-xs"
                          />
                          <YAxis
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                            tickFormatter={(value) => `${value}%`}
                            className="text-xs"
                          />
                          <Tooltip
                            formatter={(value: any) => [`${value}%`, "Rate"]}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {trends.bank_rate_trends && Object.keys(trends.bank_rate_trends).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-jakarta">Bank Rate Trends</CardTitle>
                      <CardDescription>
                        Interest rate movements across major banks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            type="category"
                            allowDuplicatedCategory={false}
                            tickFormatter={(value) => {
                              try {
                                return format(new Date(value), "MMM yyyy");
                              } catch {
                                return value;
                              }
                            }}
                            className="text-xs"
                          />
                          <YAxis
                            tickFormatter={(value) => `${value}%`}
                            className="text-xs"
                          />
                          <Tooltip
                            formatter={(value: any) => [`${value}%`, "Rate"]}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Legend />
                          {Object.entries(trends.bank_rate_trends).map(([bank, data]: [string, any], index) => {
                            const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#a78bfa"];
                            return (
                              <Line
                                key={bank}
                                data={data}
                                type="monotone"
                                dataKey="rate"
                                stroke={colors[index % colors.length]}
                                name={bank}
                                strokeWidth={2}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
