import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const indianBanks = [
  "HDFC Bank",
  "SBI - State Bank of India",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "IDFC First Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Other",
];

export default function AddLoan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    bankName: "",
    loanAmount: "",
    interestRate: "",
    emiAmount: "",
    tenureYears: "",
    startDate: "",
    accountNumber: "",
  });

  const createLoanMutation = useMutation({
    mutationFn: async (loanData: any) => {
      const res = await apiRequest("POST", "/api/loans", loanData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/loans'] });
      toast({
        title: "Loan Added Successfully",
        description: "Your home loan has been added to your portfolio.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Loan",
        description: error.message || "Failed to add loan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loanData = {
      bank_name: formData.bankName,
      loan_amount: parseFloat(formData.loanAmount),
      interest_rate: parseFloat(formData.interestRate),
      emi_amount: parseFloat(formData.emiAmount),
      tenure_months: parseInt(formData.tenureYears) * 12,
      start_date: new Date(formData.startDate).toISOString(),
      account_number: formData.accountNumber || null,
    };

    createLoanMutation.mutate(loanData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-add-loan-heading">
            Add New Loan
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter your home loan details to start tracking and optimizing
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
          <CardDescription>
            Provide accurate information from your loan documents for best results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Select value={formData.bankName} onValueChange={(value) => handleChange("bankName", value)}>
                <SelectTrigger id="bankName" data-testid="select-bank">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {indianBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Original Loan Amount (₹) *</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="50,00,000"
                value={formData.loanAmount}
                onChange={(e) => handleChange("loanAmount", e.target.value)}
                required
                className="font-mono"
                data-testid="input-loan-amount"
              />
              <p className="text-xs text-muted-foreground">
                The total loan amount sanctioned by the bank
              </p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate">Current Interest Rate (% p.a.) *</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                placeholder="8.50"
                value={formData.interestRate}
                onChange={(e) => handleChange("interestRate", e.target.value)}
                required
                className="font-mono"
                data-testid="input-interest-rate"
              />
            </div>

            {/* EMI Amount */}
            <div className="space-y-2">
              <Label htmlFor="emiAmount">Monthly EMI (₹) *</Label>
              <Input
                id="emiAmount"
                type="number"
                placeholder="38,500"
                value={formData.emiAmount}
                onChange={(e) => handleChange("emiAmount", e.target.value)}
                required
                className="font-mono"
                data-testid="input-emi"
              />
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <Label htmlFor="tenureYears">Loan Tenure (Years) *</Label>
              <Input
                id="tenureYears"
                type="number"
                placeholder="20"
                value={formData.tenureYears}
                onChange={(e) => handleChange("tenureYears", e.target.value)}
                required
                data-testid="input-tenure"
              />
              <p className="text-xs text-muted-foreground">
                Original loan tenure when sanctioned
              </p>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Loan Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
                data-testid="input-start-date"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Loan Account Number (Optional)</Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="XXXXXX1234"
                value={formData.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                data-testid="input-account-number"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={createLoanMutation.isPending}
                data-testid="button-add-loan"
              >
                {createLoanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Loan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Loan
                  </>
                )}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline" disabled={createLoanMutation.isPending} data-testid="button-cancel">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>You can find all this information in your loan sanction letter or monthly statement from your bank.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Loan Amount: Original sanctioned amount</li>
            <li>Interest Rate: Your current applicable rate</li>
            <li>EMI: Your monthly repayment amount</li>
            <li>Tenure: Total loan period in years</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
