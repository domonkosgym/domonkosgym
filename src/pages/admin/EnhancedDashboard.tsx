import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, MousePointer, Clock, Globe, Award, Target, BarChart3 } from "lucide-react";

interface SessionMetric {
  session_id: string;
  total_duration: number;
  page_count: number;
  is_returning_visitor: boolean;
  device_type: string;
  country: string;
  city: string;
  created_at: string;
}

interface CTAClick {
  cta_text: string;
  cta_type: string;
  page_path: string;
  clicked_at: string;
}

interface FormInteraction {
  form_type: string;
  started_at: string;
  completed_at: string | null;
  abandoned: boolean;
  time_spent: number;
}

interface LeadScore {
  lead_id: string;
  score: number;
  page_views_count: number;
  time_on_site: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EnhancedDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionMetric[]>([]);
  const [ctaClicks, setCTAClicks] = useState<CTAClick[]>([]);
  const [formInteractions, setFormInteractions] = useState<FormInteraction[]>([]);
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, ctaRes, formsRes, scoresRes] = await Promise.all([
          supabase.from('session_metrics').select('*').order('created_at', { ascending: false }).limit(1000),
          supabase.from('cta_clicks').select('*').order('clicked_at', { ascending: false }).limit(1000),
          supabase.from('form_interactions').select('*').order('started_at', { ascending: false }).limit(500),
          supabase.from('lead_scores').select('*').order('score', { ascending: false }).limit(100)
        ]);

        if (sessionsRes.data) setSessions(sessionsRes.data);
        if (ctaRes.data) setCTAClicks(ctaRes.data);
        if (formsRes.data) setFormInteractions(formsRes.data);
        if (scoresRes.data) setLeadScores(scoresRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Konverziós tölcsér
  const conversionFunnel = useMemo(() => {
    const totalVisitors = sessions.length;
    const leadsCount = formInteractions.filter(f => f.completed_at).length;
    const hotLeads = leadScores.filter(l => l.score > 50).length;
    
    return [
      { stage: 'Látogatók', count: totalVisitors, percent: 100 },
      { stage: 'Érdeklődők', count: leadsCount, percent: totalVisitors > 0 ? (leadsCount / totalVisitors * 100) : 0 },
      { stage: 'Hot Leads', count: hotLeads, percent: totalVisitors > 0 ? (hotLeads / totalVisitors * 100) : 0 }
    ];
  }, [sessions, formInteractions, leadScores]);

  // Session időtartam átlag
  const avgSessionDuration = useMemo(() => {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);
    return Math.round(total / sessions.length);
  }, [sessions]);

  // Visszatérő látogatók aránya
  const returningVisitorRate = useMemo(() => {
    if (sessions.length === 0) return 0;
    const returning = sessions.filter(s => s.is_returning_visitor).length;
    return Math.round((returning / sessions.length) * 100);
  }, [sessions]);

  // Eszköz típusok eloszlása
  const deviceBreakdown = useMemo(() => {
    const devices = sessions.reduce((acc, s) => {
      const type = s.device_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(devices).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [sessions]);

  // CTA teljesítmény
  const ctaPerformance = useMemo(() => {
    const ctas = ctaClicks.reduce((acc, click) => {
      acc[click.cta_text] = (acc[click.cta_text] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ctas)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [ctaClicks]);

  // Űrlap abandon rate
  const formAbandonRate = useMemo(() => {
    if (formInteractions.length === 0) return 0;
    const abandoned = formInteractions.filter(f => f.abandoned).length;
    return Math.round((abandoned / formInteractions.length) * 100);
  }, [formInteractions]);

  // Forgalmi csúcsidők (óránkénti bontás)
  const trafficByHour = useMemo(() => {
    const hourly = sessions.reduce((acc, s) => {
      const hour = new Date(s.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      visits: hourly[i] || 0
    }));
  }, [sessions]);

  // Napi trend (utolsó 30 nap)
  const dailyTrend = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyCounts = sessions.reduce((acc, s) => {
      const date = s.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return last30Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      visits: dailyCounts[date] || 0
    }));
  }, [sessions]);

  // Hot leads (top 10)
  const hotLeads = useMemo(() => {
    return leadScores
      .filter(l => l.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [leadScores]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-lg">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fejlett Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes Session</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlag Session Idő</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(avgSessionDuration / 60)}p {avgSessionDuration % 60}mp</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visszatérő Látogatók</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returningVisitorRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Űrlap Abandon Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formAbandonRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Konverziós Tölcsér */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Konverziós Tölcsér
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Darabszám" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Napi Trend és Óránkénti Forgalom */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Napi Trend (30 nap)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#8884d8" name="Látogatások" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forgalmi Csúcsidők</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Eszköz Breakdown és CTA Teljesítmény */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Eszköz Típusok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Top 10 CTA Kattintások
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ctaPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hot Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Hot Leads (Legaktívabb Érdeklődők)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hotLeads.length === 0 ? (
              <p className="text-muted-foreground">Még nincsenek hot leads</p>
            ) : (
              hotLeads.map((lead, index) => (
                <div key={lead.lead_id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">#{index + 1}</span>
                    <div>
                      <p className="font-medium">Lead Score: {lead.score}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.page_views_count} oldal | {Math.floor(lead.time_on_site / 60)}p {lead.time_on_site % 60}mp
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
