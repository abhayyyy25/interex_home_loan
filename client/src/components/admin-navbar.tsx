import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  User,
  ShieldCheck,
  Menu,
  IndianRupee,
  LayoutDashboard,
  Bell,
  FileText,
  BarChart3,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AdminNavbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="px-6 h-14 flex items-center justify-between">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Interex Admin
                </SheetTitle>
              </SheetHeader>
              <nav className="p-4 space-y-2">
                <Link href="/admin">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors">
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    <span className="font-medium">Admin Control Center</span>
                  </div>
                </Link>
                <Link href="/admin/notifications/send">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors">
                    <Bell className="w-5 h-5 text-primary" />
                    <span className="font-medium">Admin Notifications</span>
                  </div>
                </Link>
                <Link href="/admin/negotiations">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Manage Negotiations</span>
                  </div>
                </Link>
                <Link href="/reports">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="font-medium">Reports & Analytics</span>
                  </div>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Logo */}
        <Link href="/admin" className="lg:hidden">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            <span className="font-bold font-display">Interex</span>
            <Badge variant="outline" className="text-xs gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
          </div>
        </Link>

        {/* Desktop - Page Title Area (empty since sidebar has title) */}
        <div className="hidden lg:block" />

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          <NotificationsBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
                  <Badge variant="secondary" className="w-fit mt-1 text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Administrator
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
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

