import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Loan {
  id: number;
  bank_name: string;
  outstanding_principal: number;
  interest_rate: number;
  emi_amount: number;
  is_active: boolean;
}

export default function NewNegotiation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [targetRate, setTargetRate] = useState<string>("");

  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans/"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { loan_id: number; target_rate: number }) => {
      const response = await apiRequest("POST", "/api/negotiations/", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Negotiation request created",
        description: "AI has generated your negotiation letter. Admin will review shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/"] });
      setLocation(`/negotiations/${data.id}`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create negotiation request. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoanId || !targetRate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a loan and enter target rate",
      });
      return;
    }

    const rate = parseFloat(targetRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid rate",
        description: "Please enter a valid interest rate",
      });
      return;
    }

    createMutation.mutate({
      loan_id: parseInt(selectedLoanId),
      target_rate: rate,
    });
  };

  const selectedLoan = loans?.find(l => l.id.toString() === selectedLoanId);

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/negotiations")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Request Rate Negotiation</h1>
          <p className="text-muted-foreground">
            Get AI-powered professional letters to negotiate better rates with your bank
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Negotiation Details
          </CardTitle>
          <CardDescription>
            Select your loan and specify your target interest rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="loan">Select Loan</Label>
              <Select
                value={selectedLoanId}
                onValueChange={setSelectedLoanId}
                disabled={isLoading}
              >
                <SelectTrigger id="loan" data-testid="select-loan">
                  <SelectValue placeholder="Choose a loan" />
                </SelectTrigger>
                <SelectContent>
                  {loans?.filter(l => l.is_active).map((loan) => (
                    <SelectItem key={loan.id} value={loan.id.toString()}>
                      {loan.bank_name} - ₹{(loan.outstanding_principal / 100000).toFixed(2)}L @ {loan.interest_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLoan && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Rate</p>
                      <p className="text-2xl font-bold">{selectedLoan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly EMI</p>
                      <p className="text-2xl font-bold">₹{selectedLoan.emi_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-lg font-semibold">₹{(selectedLoan.outstanding_principal / 100000).toFixed(2)}L</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="target-rate">Target Interest Rate (%)</Label>
              <div className="flex gap-2 items-center">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="target-rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 7.5"
                  value={targetRate}
                  onChange={(e) => setTargetRate(e.target.value)}
                  data-testid="input-target-rate"
                />
              </div>
              {selectedLoan && targetRate && parseFloat(targetRate) < selectedLoan.interest_rate && (
                <p className="text-sm text-green-600">
                  Potential reduction: {(selectedLoan.interest_rate - parseFloat(targetRate)).toFixed(2)}%
                </p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setLocation("/negotiations")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !selectedLoanId || !targetRate}
            data-testid="button-generate-letter"
          >
            {createMutation.isPending ? "Generating..." : "Generate Negotiation Letter"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Select the loan you want to renegotiate</li>
            <li>Enter your desired target interest rate</li>
            <li>Our AI will generate a professional, persuasive letter citing market rates</li>
            <li>Admin will review and approve your letter</li>
            <li>Download and send the letter to your bank</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
