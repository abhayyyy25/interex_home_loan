import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bell,
  FileText,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  IndianRupee,
  ChevronRight,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminStats {
  pending_negotiations: number;
}

const sidebarLinks = [
  {
    title: "Admin Control Center",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview & Stats",
  },
  {
    title: "Admin Notifications",
    href: "/admin/notifications/send",
    icon: Bell,
    description: "Send announcements",
  },
  {
    title: "Manage Negotiations",
    href: "/admin/negotiations",
    icon: FileText,
    description: "Review requests",
    showBadge: true,
  },
  {
    title: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    description: "Platform insights",
  },
];

export function AdminSidebar() {
  const [location] = useLocation();

  // Fetch stats for pending badge
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats/");
      return res.json();
    },
  });

  const pendingCount = stats?.pending_negotiations || 0;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 min-h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b">
        <Link href="/admin">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="p-2 rounded-lg bg-primary/10">
              <IndianRupee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold font-display">Interex</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
          Navigation
        </p>
        {sidebarLinks.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-primary")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isActive && "text-primary-foreground")}>
                    {link.title}
                  </p>
                  <p className={cn("text-xs truncate", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {link.description}
                  </p>
                </div>
                {link.showBadge && pendingCount > 0 && (
                  <Badge
                    variant={isActive ? "secondary" : "destructive"}
                    className="ml-auto"
                  >
                    {pendingCount}
                  </Badge>
                )}
                {!link.showBadge && (
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                      isActive && "opacity-100 text-primary-foreground"
                    )}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="px-3 py-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Admin Mode</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You have full platform access
          </p>
        </div>
      </div>
    </aside>
  );
}

