import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, LogOut, User, ShieldCheck } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await logout();
  };

  // Determine home link based on user role
  const homeLink = isAdmin ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href={homeLink}>
          <div className="flex items-center gap-2 cursor-pointer hover-elevate px-3 py-2 rounded-md transition-colors">
            <IndianRupee className="w-6 h-6 text-primary" data-testid="logo-icon" />
            <span className="text-xl font-bold font-display" data-testid="text-brand-name">
              Interex
            </span>
            {isAdmin && (
              <Badge variant="outline" className="ml-2 text-xs gap-1">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationsBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-user-menu"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`
                      : user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {isAdmin && (
                    <Badge variant="secondary" className="w-fit mt-1 text-xs">
                      Administrator
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Admin-specific menu items */}
              {isAdmin ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Control Center</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/negotiations">Manage Negotiations</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/notifications/send">Send Notifications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reports">Platform Reports</Link>
                  </DropdownMenuItem>
                </>
              ) : (
                /* Regular user menu items */
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/loans/add">Add Loan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calculator">Calculator</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/chat">AI Advisor</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/negotiations">Negotiations</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reports">Reports</Link>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
