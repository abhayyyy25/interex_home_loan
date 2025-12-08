import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle2, XCircle, Send } from "lucide-react";
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
  sent: { label: "Sent to Bank", icon: Send, className: "bg-blue-500" },
};

export default function Negotiations() {
  const [, setLocation] = useLocation();

  const { data: negotiations, isLoading } = useQuery<Negotiation[]>({
    queryKey: ["/api/negotiations/"],
  });

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Negotiations</h1>
          <p className="text-muted-foreground">
            AI-powered negotiation letters to reduce your loan interest rates
          </p>
        </div>
        <Button onClick={() => setLocation("/negotiations/new")} data-testid="button-new-negotiation">
          <Plus className="w-4 h-4 mr-2" />
          New Negotiation
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : negotiations && negotiations.length > 0 ? (
        <div className="grid gap-4">
          {negotiations.map((negotiation) => {
            const config = statusConfig[negotiation.status as keyof typeof statusConfig];
            const Icon = config?.icon || FileText;

            return (
              <Card
                key={negotiation.id}
                className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => setLocation(`/negotiations/${negotiation.id}`)}
                data-testid={`card-negotiation-${negotiation.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          Rate Reduction: {negotiation.current_rate}% → {negotiation.target_rate}%
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Created {format(new Date(negotiation.created_at), "MMM d, yyyy")}
                        </span>
                        <span>•</span>
                        <span>Potential reduction: {(negotiation.current_rate - negotiation.target_rate).toFixed(2)}%</span>
                      </div>
                      {negotiation.admin_notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          Admin: {negotiation.admin_notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={`${config?.className} text-white`}
                      data-testid={`badge-status-${negotiation.id}`}
                    >
                      {config?.label || negotiation.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No negotiation requests yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first negotiation request to get AI-generated professional letters
            </p>
            <Button onClick={() => setLocation("/negotiations/new")} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Create Negotiation Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
