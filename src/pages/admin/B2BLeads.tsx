import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  interest_type: string;
  company: string | null;
  headcount: number | null;
  created_at: string;
}

export default function B2BLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, email, phone, interest_type, company, headcount, created_at")
        .eq("interest_type", "B2B")
        .order("created_at", { ascending: false })
        .limit(200);
      setLeads(data || []);
      setLoading(false);
    };
    load();

    // Realtime subscription for new B2B leads
    const channel = supabase
      .channel('b2b-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: 'interest_type=eq.B2B'
        },
        () => {
          console.log('New B2B lead detected, refreshing...');
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chartData = useMemo(() => {
    if (leads.length === 0) return [];
    const dailyCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      const date = new Date(lead.created_at).toLocaleDateString("hu-HU");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .reverse()
      .slice(-30);
  }, [leads]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">B2B Ajánlatok</h1>
        <p className="text-muted-foreground">Cégek és vállalati ügyfelek érdeklődései</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Napi B2B ajánlatkérések (utolsó 30 nap)</h2>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Még nincs B2B ajánlat
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="bg-card border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Cég</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Létszám</TableHead>
                <TableHead>Dátum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>Betöltés...</TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Még nincs B2B ajánlat</TableCell>
                </TableRow>
              ) : (
                leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.full_name}</TableCell>
                    <TableCell className="font-medium">{l.company ?? "-"}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>{l.phone ?? "-"}</TableCell>
                    <TableCell>{l.headcount ? `${l.headcount} fő` : "-"}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
