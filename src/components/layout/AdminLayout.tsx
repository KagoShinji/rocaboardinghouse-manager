import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Gauge,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
  { to: '/admin/tenants', label: 'Tenants', icon: Users },
  { to: '/admin/readings', label: 'Meter Readings', icon: Gauge },
  { to: '/admin/bills', label: 'Bills', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">ROCA</h1>
          <p className="text-xs text-muted-foreground">Property Management</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userProfile?.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar (mobile) */}
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">ROCA</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavClick={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
