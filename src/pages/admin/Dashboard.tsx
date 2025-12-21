import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Building2, Eye, TrendingUp, Clock, Globe, Users, Activity, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface PageView {
  id: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  interest_type: string;
  company: string | null;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLeads: 0,
    b2bLeads: 0,
    pageViews: 0,
    recentLeads: 0,
    uniqueSessions: 0,
    avgDailyViews: 0,
  });
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentPageViews, setRecentPageViews] = useState<PageView[]>([]);
  const [hasCompanyInfo, setHasCompanyInfo] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [leadsResult, pageViewsResult, companyInfoResult] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("page_views").select("*").order("created_at", { ascending: false }),
        supabase.from("company_billing_info").select("*").limit(1).maybeSingle(),
      ]);

      const leads = leadsResult.data || [];
      const views = pageViewsResult.data || [];
      const companyInfo = companyInfoResult.data;

      setHasCompanyInfo(!!companyInfo);
      setPageViews(views);
      setRecentLeads(leads.slice(0, 5));
      setRecentPageViews(views.slice(0, 10));

      const b2bCount = leads.filter((l) => l.interest_type === "B2B").length;
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const recentCount = leads.filter((l) => new Date(l.created_at) >= last7Days).length;
      
      const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
      const daysWithData = views.length > 0 ? 
        Math.max(1, Math.ceil((Date.now() - new Date(views[views.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))) : 1;
      const avgDaily = views.length / daysWithData;

      setStats({
        totalLeads: leads.length,
        b2bLeads: b2bCount,
        pageViews: views.length,
        recentLeads: recentCount,
        uniqueSessions,
        avgDailyViews: Math.round(avgDaily),
      });
    };

    fetchData();

    // Realtime subscriptions
    const leadsChannel = supabase
      .channel('dashboard-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          console.log('Dashboard: New lead detected, refreshing...');
          fetchData();
        }
      )
      .subscribe();

    const pageViewsChannel = supabase
      .channel('dashboard-pageviews-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views'
        },
        () => {
          console.log('Dashboard: New page view detected, refreshing...');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(pageViewsChannel);
    };
  }, []);

  const chartData = useMemo(() => {
    if (pageViews.length === 0) return [];
    
    const dailyCounts: Record<string, number> = {};
    pageViews.forEach((view) => {
      const date = new Date(view.created_at).toLocaleDateString("hu-HU");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .reverse()
      .slice(-30);
  }, [pageViews]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Üdvözöllek az admin felületen!</p>
      </div>

      {!hasCompanyInfo && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Figyelem: Hiányoznak a céges számlázási adatok</AlertTitle>
          <AlertDescription>
            A fizetős szolgáltatásokhoz szükséges számlák kiállításához add meg a céges adatokat.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => navigate("/admin/company-info")}
            >
              Céges adatok beállítása
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card 
          className="p-3 sm:p-4 bg-card border-border cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/admin/leads")}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Összes Kapcsolat</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalLeads}</p>
            </div>
            <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card 
          className="p-3 sm:p-4 bg-card border-border cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/admin/b2b-leads")}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">B2B Ajánlatok</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.b2bLeads}</p>
            </div>
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card 
          className="p-3 sm:p-4 bg-card border-border cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/admin/analytics")}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Oldalmegtekintések</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.pageViews}</p>
            </div>
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-card border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Új (7 nap)</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.recentLeads}</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-card border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Egyedi munkamenetek</p>
              <p className="text-lg sm:text-xl font-semibold">{stats.uniqueSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-card border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Átl. napi látogatás</p>
              <p className="text-lg sm:text-xl font-semibold">{stats.avgDailyViews}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-card border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Összes oldal</p>
              <p className="text-lg sm:text-xl font-semibold">{new Set(pageViews.map(v => v.page_path)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-3 sm:p-6 bg-card border-border">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Napi forgalom (utolsó 30 nap)</h2>
        {chartData.length === 0 ? (
          <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
            Még nincs adat a grafikonhoz
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: window.innerWidth < 640 ? 9 : 12 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: window.innerWidth < 640 ? 9 : 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: window.innerWidth < 640 ? 2 : 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-3 sm:p-6 bg-card border-border">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Legutóbbi kapcsolatok (5)</span>
          </h2>
          {recentLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm">Még nincs beküldött űrlap</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between border-b border-border pb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{lead.full_name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{lead.email}</p>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                    {new Date(lead.created_at).toLocaleDateString("hu-HU")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-3 sm:p-6 bg-card border-border">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Legutóbbi látogatások (10)</span>
          </h2>
          {recentPageViews.length === 0 ? (
            <p className="text-muted-foreground text-sm">Még nincs oldalmegtekintés</p>
          ) : (
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {recentPageViews.map((view) => (
                <div key={view.id} className="text-xs sm:text-sm border-b border-border pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate flex-1">{view.page_path}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {new Date(view.created_at).toLocaleTimeString("hu-HU")}
                    </span>
                  </div>
                  {view.ip_address && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">IP: {view.ip_address}</p>
                  )}
                  {view.referrer && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Forrás: {view.referrer}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}