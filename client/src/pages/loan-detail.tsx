import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIndianCurrency, formatReadableDate, addMonths } from "@/lib/utils";
import { ArrowLeft, Bot, Calculator, Send, FileText, User } from "lucide-react";
import { Link } from "wouter";

export default function LoanDetail() {
  const params = useParams();
  console.log("URL Params:", params);
  const loanId = params.id;
  if (!loanId || isNaN(Number(loanId))) {
    return <div className="p-6">Loan not found!</div>;
  }  

  const { data: loan, isLoading } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/loans/${loanId}`);  // FIXED
      return res.json();
    },
  });
  

  if (isLoading) return <div className="p-6">Loading loan...</div>;
  if (!loan) return <div className="p-6">Loan not found!</div>;

  const progress =
    ((loan.loan_amount - loan.outstanding_principal) / loan.loan_amount) * 100;

  const totalInterestPaid =
    (loan.tenure_months - loan.remaining_tenure_months) * loan.emi_amount -
    (loan.loan_amount - loan.outstanding_principal);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {loan.bank_name} Loan
          </h1>
          <p className="text-muted-foreground mt-1">
            Account: {loan.account_number || "N/A"}
          </p>
        </div>

        <Badge variant="secondary" className="text-sm">
          {loan.interest_rate}% p.a.
        </Badge>
      </div>

      {/* Hero Section */}
      <Card className="border-primary">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Outstanding Principal</p>
              <p className="text-4xl font-bold text-primary">
                {formatIndianCurrency(loan.outstanding_principal, 0)}
              </p>
              <Progress value={progress} className="h-2 mt-4" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(1)}% repaid of {formatIndianCurrency(loan.loan_amount, 0)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Monthly EMI</p>
              <p className="text-4xl font-bold">
                {formatIndianCurrency(loan.emi_amount, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Next EMI: {formatReadableDate(loan.next_emi_date)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Remaining Tenure</p>
              <p className="text-4xl font-bold">
                {Math.floor(loan.remaining_tenure_months / 12)}y{" "}
                {loan.remaining_tenure_months % 12}m
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Started: {formatReadableDate(loan.start_date)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href="/calculator">
          <Button>
            <Calculator className="w-4 h-4 mr-2" />
            Make Prepayment
          </Button>
        </Link>
        <Link href="/negotiations/new">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Request Rate Negotiation
          </Button>
        </Link>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Download Statement
        </Button>
      </div>
    </div>
  );
}
