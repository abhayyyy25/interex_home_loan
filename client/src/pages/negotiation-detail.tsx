import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Negotiation {
  id: number;
  loan_id: number;
  current_rate: number;
  target_rate: number;
  letter_content: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig = {
  draft: { label: "Draft", icon: FileText, className: "bg-gray-500" },
  pending: { label: "Pending Review", icon: Clock, className: "bg-yellow-500" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-green-500" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500" },
  sent: { label: "Sent", icon: FileText, className: "bg-blue-500" },
};

export default function NegotiationDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const negotiationId = params.id;

  const { data: negotiation, isLoading } = useQuery<Negotiation>({
    queryKey: ["/api/negotiations", negotiationId],
    queryFn: async () => {
      const response = await fetch(`/api/negotiations/${negotiationId}/`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch negotiation");
      return response.json();
    },
    enabled: !!negotiationId,
  });

  const handleDownload = () => {
    if (!negotiation) return;
    
    const blob = new Blob([negotiation.letter_content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negotiation-letter-${negotiation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Card className="animate-pulse">
          <CardContent className="h-96" />
        </Card>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Negotiation request not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/negotiations")}
            >
              Back to Negotiations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[negotiation.status as keyof typeof statusConfig];
  const Icon = config?.icon || FileText;

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Negotiation Request</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(negotiation.created_at), "MMMM d, yyyy")}
          </p>
        </div>
        <Badge className={`${config?.className} text-white`} data-testid="badge-status">
          <Icon className="w-3 h-3 mr-1" />
          {config?.label || negotiation.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Rate</p>
              <p className="text-3xl font-bold text-destructive">{negotiation.current_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Target Rate</p>
              <p className="text-3xl font-bold text-green-600">{negotiation.target_rate}%</p>
            </div>
            <div className="col-span-2 border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">Potential Reduction</p>
              <p className="text-2xl font-bold text-primary">
                {(negotiation.current_rate - negotiation.target_rate).toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {negotiation.admin_notes && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{negotiation.admin_notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI-Generated Negotiation Letter</CardTitle>
          <Button
            variant="outline"
            onClick={handleDownload}
            data-testid="button-download-letter"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Letter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm" data-testid="text-letter-content">
              {negotiation.letter_content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {negotiation.status === "approved" && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Letter Approved!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your negotiation letter has been approved. Download it and send it to your bank
                  to start the rate reduction process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {negotiation.status === "rejected" && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Letter Rejected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This negotiation request was rejected. Please check the admin notes above for
                  more information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
