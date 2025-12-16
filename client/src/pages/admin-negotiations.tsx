import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Negotiation {
  id: number;
  user_id: string;
  loan_id: number;
  current_rate: number;
  target_rate: number;
  letter_content: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-500" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-green-500" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500" },
};

export default function AdminNegotiations() {
  const { toast } = useToast();
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: negotiations, isLoading } = useQuery<Negotiation[]>({
    queryKey: ["/api/negotiations/admin/all", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? "/api/negotiations/admin/all/"
        : `/api/negotiations/admin/all/?status_filter=${statusFilter}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; admin_notes?: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/negotiations/${data.id}/approve/`,
        { admin_notes: data.admin_notes ?? null }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Negotiation approved",
        description: "The negotiation letter has been approved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/admin/all"] });
      closeDialog();
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: async (data: { id: number; admin_notes?: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/negotiations/${data.id}/reject/`,
        { admin_notes: data.admin_notes ?? null }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Negotiation rejected",
        description: "The negotiation letter has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/admin/all"] });
      closeDialog();
    },
  });
  

  const openReviewDialog = (negotiation: Negotiation, action: "approve" | "reject") => {
    setSelectedNegotiation(negotiation);
    setActionType(action);
    setAdminNotes(negotiation.admin_notes || "");
  };

  const closeDialog = () => {
    setSelectedNegotiation(null);
    setActionType(null);
    setAdminNotes("");
  };

  const handleSubmitReview = () => {
    if (!selectedNegotiation || !actionType) return;

    const data = {
      id: selectedNegotiation.id,
      admin_notes: adminNotes || undefined,
    };

    if (actionType === "approve") {
      approveMutation.mutate(data);
    } else {
      rejectMutation.mutate(data);
    }
  };

  const pendingCount = negotiations?.filter(n => n.status === "pending").length || 0;
  const approvedCount = negotiations?.filter(n => n.status === "approved").length || 0;
  const rejectedCount = negotiations?.filter(n => n.status === "rejected").length || 0;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Negotiation Management</h1>
        <p className="text-muted-foreground">
          Review and approve customer negotiation letters
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
              ))}
            </div>
          ) : negotiations && negotiations.length > 0 ? (
            <div className="grid gap-4">
              {negotiations.map((negotiation) => {
                const config = statusConfig[negotiation.status as keyof typeof statusConfig];
                const Icon = config?.icon || FileText;

                return (
                  <Card key={negotiation.id} data-testid={`card-negotiation-${negotiation.id}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                Rate: {negotiation.current_rate}% → {negotiation.target_rate}%
                              </h3>
                              <Badge className={`${config?.className} text-white`}>
                                <Icon className="w-3 h-3 mr-1" />
                                {config?.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Submitted {format(new Date(negotiation.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          {negotiation.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReviewDialog(negotiation, "reject")}
                                data-testid={`button-reject-${negotiation.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openReviewDialog(negotiation, "approve")}
                                data-testid={`button-approve-${negotiation.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-semibold mb-2">Negotiation Letter Preview:</p>
                          <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground line-clamp-3">
                            {negotiation.letter_content}
                          </pre>
                        </div>

                        {negotiation.admin_notes && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-semibold mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">
                              {negotiation.admin_notes}
                            </p>
                          </div>
                        )}
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
                <p className="text-muted-foreground">No negotiations found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedNegotiation} onOpenChange={closeDialog}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Negotiation Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedNegotiation && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm mb-2">
                  <span className="font-semibold">Rate:</span> {selectedNegotiation.current_rate}% →{" "}
                  {selectedNegotiation.target_rate}%
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Reduction:</span>{" "}
                  {(selectedNegotiation.current_rate - selectedNegotiation.target_rate).toFixed(2)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes for the customer..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-admin-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-review">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={actionType === "approve" ? "default" : "destructive"}
              data-testid="button-confirm-review"
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
