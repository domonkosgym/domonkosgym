import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { Clock } from "lucide-react";

export default function AdminLayout() {
  const { signOut } = useAuth();
  
  // Auto logout after 10 minutes of inactivity
  const { remainingTime } = useInactivityTimer();
  
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full" style={{ backgroundColor: 'hsl(var(--admin-bg))' }}>
          <AdminSidebar />
          <main className="flex-1 overflow-auto min-w-0">
            <header className="h-12 sm:h-14 flex items-center border-b px-2 sm:px-4" style={{ 
              backgroundColor: 'hsl(var(--admin-card))',
              borderColor: 'hsl(var(--admin-border))'
            }}>
              <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-3">
                  <SidebarTrigger className="text-white hover:bg-white/10" />
                  <Link to="/admin" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors hidden xs:inline">
                    ← Dashboard
                  </Link>
                </div>
                <div className="flex items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-mono">{formatTime(remainingTime)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={signOut}
                    className="text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                  >
                    <span className="hidden sm:inline">Kijelentkezés</span>
                    <span className="sm:hidden">Ki</span>
                  </Button>
                </div>
              </div>
            </header>
            <div className="p-3 sm:p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}