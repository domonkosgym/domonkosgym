import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string | null;
  service_name: string;
  service_price: number;
  tax_rate: number;
  total_amount: number;
  currency: string;
  issued_at: string;
  created_at: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("issued_at", { ascending: false });
      
      if (error) {
        console.error("Error loading invoices:", error);
        toast.error("Hiba a számlák betöltése során");
      } else {
        setInvoices(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleDownload = async (invoice: Invoice) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice", {
        body: {
          customerName: invoice.customer_name,
          customerEmail: invoice.customer_email,
          customerAddress: invoice.customer_address || "",
          serviceName: invoice.service_name,
          servicePrice: invoice.service_price,
          invoiceNumber: invoice.invoice_number,
        },
      });

      if (error) {
        console.error("Error response:", error);
        toast.error(`Hiba: ${error.message || "Számla újraküldése sikertelen"}`);
        return;
      }

      console.log("Invoice resend response:", data);
      toast.success("Számla újraküldve az ügyfélnek");
    } catch (error: any) {
      console.error("Error resending invoice:", error);
      toast.error(`Hiba: ${error.message || "Számla újraküldése sikertelen"}`);
    }
  };

  const monthlyRevenue = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    invoices.forEach((invoice) => {
      const month = new Date(invoice.issued_at).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "short",
      });
      monthlyData[month] = (monthlyData[month] || 0) + Number(invoice.total_amount);
    });
    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-12);
  }, [invoices]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const avgInvoice = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Számlák</h1>
        <p className="text-muted-foreground">Kiállított számlák kezelése és analitika</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Összes számla</p>
          <p className="text-3xl font-bold mt-2">{invoices.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Összes bevétel</p>
          <p className="text-3xl font-bold mt-2">
            {totalRevenue.toLocaleString("hu-HU")} {invoices[0]?.currency || "HUF"}
          </p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-sm text-muted-foreground">Átlagos számlaérték</p>
          <p className="text-3xl font-bold mt-2">
            {avgInvoice.toLocaleString("hu-HU")} {invoices[0]?.currency || "HUF"}
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Havi bevétel</h2>
        {monthlyRevenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Még nincs adat
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => `${value.toLocaleString("hu-HU")} HUF`}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Összes számla</h2>
        {loading ? (
          <p>Betöltés...</p>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground">Még nincs kiállított számla</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Számlaszám</TableHead>
                  <TableHead>Ügyfél</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Szolgáltatás</TableHead>
                  <TableHead className="text-right">Összeg</TableHead>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Művelet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell className="text-sm">{invoice.customer_email}</TableCell>
                    <TableCell>{invoice.service_name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(invoice.total_amount).toLocaleString("hu-HU")} {invoice.currency}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(invoice.issued_at).toLocaleDateString("hu-HU")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Újraküldés
                      </Button>
                    </TableCell>
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
