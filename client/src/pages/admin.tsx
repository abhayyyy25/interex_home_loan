"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
} from "lucide-react";

// -------------------------
// 1. Updated Types to match admin.py JSON response
// -------------------------

interface AdminStats {
  total_users: number;
  premium_users: number;
  pending_negotiations: number;
  total_savings_generated: number;
}

type NegotiationStatus = "pending" | "approved" | "rejected";

interface AdminNegotiation {
  id: number;
  user_name: string;
  user_email: string;
  bank_name: string;
  current_rate: number;
  target_rate: number;
  status: NegotiationStatus;
  created_at: string;
  admin_notes?: string | null;
}

// Updated to match the JSON keys from admin.py -> get_all_users()
interface AdminUser {
  id: string;
  name: string;
  email: string;
  tier: string;       // API sends "tier", not "subscription_tier"
  loan_count: number; // API sends "loan_count", not "total_loans"
  joined: string;     // API sends "joined", not "created_at"
  role: string;
}

// -------------------------
// Helper
// -------------------------
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// -------------------------
// Component
// -------------------------

export default function AdminDashboard() {
  // 1️⃣ Admin Stats
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats/");
      return res.json();
    },
  });

  // 2️⃣ Negotiations Data
  const {
    data: negotiations = [],
    isLoading: negotiationsLoading,
    isError: negotiationsError,
  } = useQuery<AdminNegotiation[]>({
    queryKey: ["/api/negotiations/admin/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/negotiations/admin/all/");
      return res.json();
    },
  });

  // 3️⃣ NEW: Real Users Data
  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users/");
      return res.json();
    },
  });

  const pendingNegotiations = negotiations.filter(
    (n) => n.status === "pending"
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-jakarta">
              Admin Control Center
            </h1>
            <p className="text-muted-foreground">
              Monitor users, negotiation requests, and platform performance.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="w-4 h-4" />
            Admin Panel
          </Badge>
        </div>

        {/* Top KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : statsError || !stats ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats.total_users.toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.premium_users} premium users
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Pending Negotiations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : statsError || !stats ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats.pending_negotiations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pendingNegotiations.length} currently in queue
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Savings Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : statsError || !stats ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.total_savings_generated)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total interest savings from approved negotiations
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Banks Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              {negotiationsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : negotiationsError ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {
                      new Set(
                        negotiations.map((n) => n.bank_name || "Unknown Bank")
                      ).size
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique banks in active negotiations
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Negotiations overview + Users */}
        <Tabs defaultValue="negotiations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="negotiations">Negotiation Queue</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Negotiations tab */}
          <TabsContent value="negotiations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold font-jakarta">
                Pending Negotiations
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                   // Add navigation logic here if needed
                }}
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {negotiationsLoading ? (
                  <div className="p-6 space-y-2">
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                    <Skeleton className="h-6" />
                  </div>
                ) : pendingNegotiations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    <p>No pending negotiation requests</p>
                    <p className="text-xs">
                      Once users submit new negotiation requests, they will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingNegotiations.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="p-4 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{n.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              • {n.user_email}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {n.bank_name} • {n.current_rate}% →{" "}
                            <span className="font-semibold">
                              {n.target_rate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {n.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users tab - CONNECTED TO REAL DATA */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold font-jakarta">
              User Overview
            </h2>
            <Card>
              <CardContent className="p-0">
                {usersLoading ? (
                   <div className="p-4 space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                   </div>
                ) : (
                <div className="min-w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-muted-foreground">
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Tier</th>
                        <th>Loans</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="[&>td]:px-4 [&>td]:py-3 border-t hover:bg-muted/50 transition-colors"
                        >
                          <td className="font-medium">{u.name}</td>
                          <td className="text-muted-foreground">{u.email}</td>
                          <td>
                             <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                               {u.role}
                             </Badge>
                          </td>
                          <td>
                            <Badge variant="outline">{u.tier}</Badge>
                          </td>
                          <td>{u.loan_count}</td>
                          <td className="text-muted-foreground text-xs">
                            {new Date(u.joined).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}