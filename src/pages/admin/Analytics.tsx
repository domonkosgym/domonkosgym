import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

interface PageView {
  id: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
}

export default function Analytics() {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("page_views")
        .select("id, page_path, referrer, user_agent, ip_address, session_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      setViews(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      counts[v.page_path] = (counts[v.page_path] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [views]);

  const topReferrers = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          const domain = url.hostname.replace("www.", "");
          counts[domain] = (counts[domain] || 0) + 1;
        } catch {
          counts["Közvetlen"] = (counts["Közvetlen"] || 0) + 1;
        }
      } else {
        counts["Közvetlen"] = (counts["Közvetlen"] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [views]);

  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0, Unknown: 0 };
    views.forEach((v) => {
      const ua = v.user_agent?.toLowerCase() || "";
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        counts.Mobile++;
      } else if (ua.includes("tablet") || ua.includes("ipad")) {
        counts.Tablet++;
      } else if (ua) {
        counts.Desktop++;
      } else {
        counts.Unknown++;
      }
    });
    return Object.entries(counts).map(([device, count]) => ({ device, count }));
  }, [views]);

  const dailyChart = useMemo(() => {
    if (views.length === 0) return [];
    const dailyCounts: Record<string, number> = {};
    views.forEach((view) => {
      const date = new Date(view.created_at).toLocaleDateString("hu-HU");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .reverse()
      .slice(-30);
  }, [views]);

  const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
  const uniqueIPs = new Set(views.map((v) => v.ip_address).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Részletes Analitika</h1>
        <p className="text-muted-foreground">Forgalmi és látogatói adatok elemzése</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Összes megtekintés</p>
          <p className="text-3xl font-bold mt-2">{views.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Egyedi munkamenetek</p>
          <p className="text-3xl font-bold mt-2">{uniqueSessions}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Egyedi IP-k</p>
          <p className="text-3xl font-bold mt-2">{uniqueIPs}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Egyedi oldalak</p>
          <p className="text-3xl font-bold mt-2">{new Set(views.map(v => v.page_path)).size}</p>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Napi forgalom (utolsó 30 nap)</h2>
        {dailyChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Még nincs adat
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h2 className="text-lg font-semibold mb-4">Legnépszerűbb oldalak</h2>
          {topPages.length === 0 ? (
            <p className="text-muted-foreground">Nincs adat</p>
          ) : (
            <div className="space-y-2">
              {topPages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="truncate max-w-[70%] text-sm">{path}</span>
                  <span className="text-sm text-muted-foreground">{count} megtekintés</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <h2 className="text-lg font-semibold mb-4">Forgalmi források</h2>
          {topReferrers.length === 0 ? (
            <p className="text-muted-foreground">Nincs adat</p>
          ) : (
            <div className="space-y-2">
              {topReferrers.map(([ref, count]) => (
                <div key={ref} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="truncate max-w-[70%] text-sm">{ref}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Eszközök típusai</h2>
        {deviceBreakdown.every(d => d.count === 0) ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Még nincs adat
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="device" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Legutóbbi látogatások (20)</h2>
        {loading ? (
          <p>Betöltés...</p>
        ) : views.length === 0 ? (
          <p className="text-muted-foreground">Még nincs oldalmegtekintés</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oldal</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Forrás</TableHead>
                  <TableHead>Dátum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {views.slice(0, 20).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium truncate max-w-xs">{v.page_path}</TableCell>
                    <TableCell className="text-sm">{v.ip_address ?? "-"}</TableCell>
                    <TableCell className="text-sm truncate max-w-xs">{v.referrer ?? "Közvetlen"}</TableCell>
                    <TableCell className="text-sm">{new Date(v.created_at).toLocaleString("hu-HU")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
