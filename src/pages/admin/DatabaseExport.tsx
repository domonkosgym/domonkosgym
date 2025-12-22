import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Database, FileCode, Info, Loader2 } from "lucide-react";

const EXPORTABLE_TABLES = [
  { name: 'about_page', label: 'Rólam oldal' },
  { name: 'about_sections', label: 'Rólam szekciók' },
  { name: 'availability_slots', label: 'Elérhetőségi idősávok' },
  { name: 'blocked_time_slots', label: 'Blokkolt időpontok' },
  { name: 'bookings', label: 'Foglalások' },
  { name: 'cms_settings', label: 'CMS beállítások' },
  { name: 'company_billing_info', label: 'Céges adatok' },
  { name: 'contacts', label: 'Kapcsolatok' },
  { name: 'domains', label: 'Domainek' },
  { name: 'faqs', label: 'GYIK' },
  { name: 'featured_links', label: 'Kiemelt linkek' },
  { name: 'invoices', label: 'Számlák' },
  { name: 'landing_page_sections', label: 'Főoldal szekciók' },
  { name: 'leads', label: 'Érdeklődők' },
  { name: 'orders', label: 'Rendelések' },
  { name: 'order_items', label: 'Rendelés tételek' },
  { name: 'process_steps', label: 'Folyamat lépések' },
  { name: 'products', label: 'Termékek' },
  { name: 'services', label: 'Szolgáltatások' },
  { name: 'shipping_config', label: 'Szállítási konfig' },
  { name: 'shipping_providers', label: 'Szállítási szolgáltatók' },
  { name: 'site_images', label: 'Oldal képek' },
  { name: 'theme_settings', label: 'Téma beállítások' },
];

export default function DatabaseExport() {
  const [selectedTables, setSelectedTables] = useState<string[]>(EXPORTABLE_TABLES.map(t => t.name));
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => setSelectedTables(EXPORTABLE_TABLES.map(t => t.name));
  const selectNone = () => setSelectedTables([]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return `ARRAY[${value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')}]`;
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error('Válassz ki legalább egy táblát');
      return;
    }

    setExportingData(true);
    let sql = `-- Adatbázis adatok exportálás\n-- Dátum: ${new Date().toISOString()}\n\n`;

    try {
      for (const tableName of selectedTables) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (error) {
          console.error(`Hiba a ${tableName} tábla lekérdezésekor:`, error);
          continue;
        }

        if (data && data.length > 0) {
          sql += `-- ${tableName} tábla (${data.length} sor)\n`;
          
          for (const row of data) {
            const columns = Object.keys(row);
            const values = columns.map(col => escapeValue(row[col]));
            sql += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          sql += '\n';
        }
      }

      downloadFile(sql, `adatbazis_adatok_${new Date().toISOString().slice(0, 10)}.sql`);
      toast.success('Adatok exportálva');
    } catch (error) {
      console.error('Export hiba:', error);
      toast.error('Hiba az exportálás során');
    }

    setExportingData(false);
  };

  const exportSchema = async () => {
    setExportingSchema(true);

    // Generate schema based on known table structures
    let sql = `-- Adatbázis séma exportálás\n-- Dátum: ${new Date().toISOString()}\n\n`;
    
    sql += `-- ENUM típusok\n`;
    sql += `CREATE TYPE public.app_role AS ENUM ('admin', 'user');\n`;
    sql += `CREATE TYPE public.order_status AS ENUM ('NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');\n`;
    sql += `CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');\n`;
    sql += `CREATE TYPE public.product_type AS ENUM ('DIGITAL', 'PHYSICAL');\n`;
    sql += `CREATE TYPE public.shipping_method AS ENUM ('HOME', 'BOX', 'NONE');\n\n`;

    sql += `-- Megjegyzés: A teljes séma exportáláshoz használd a Supabase Dashboard-ot\n`;
    sql += `-- vagy a Lovable Cloud felületén elérhető export funkciót.\n`;
    sql += `-- Ez a fájl csak a legfontosabb tábla definíciókat tartalmazza.\n\n`;

    // Add basic table creation templates
    sql += `-- Példa tábla struktúra (products)\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.products (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  title_hu text NOT NULL,\n`;
    sql += `  title_en text NOT NULL,\n`;
    sql += `  title_es text NOT NULL,\n`;
    sql += `  description_hu text NOT NULL,\n`;
    sql += `  description_en text NOT NULL,\n`;
    sql += `  description_es text NOT NULL,\n`;
    sql += `  price_gross numeric NOT NULL,\n`;
    sql += `  product_type product_type NOT NULL DEFAULT 'DIGITAL',\n`;
    sql += `  is_active boolean DEFAULT true,\n`;
    sql += `  created_at timestamp with time zone DEFAULT now(),\n`;
    sql += `  updated_at timestamp with time zone DEFAULT now()\n`;
    sql += `);\n\n`;

    sql += `-- RLS engedélyezése\n`;
    sql += `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;\n\n`;

    sql += `-- Teljes dokumentáció: docs/INDEPENDENT_HOSTING.md\n`;

    downloadFile(sql, `adatbazis_sema_${new Date().toISOString().slice(0, 10)}.sql`);
    toast.success('Séma exportálva');
    setExportingSchema(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Adatbázis Exportálás</h1>
        <p className="text-gray-400 mt-1">Séma és adatok exportálása SQL formátumban</p>
      </div>

      <Alert className="bg-blue-900/20 border-blue-700">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertTitle className="text-blue-300">Fontos tudnivalók</AlertTitle>
        <AlertDescription className="text-blue-200/80 mt-2">
          <ul className="list-disc list-inside space-y-1">
            <li>A séma export egy alap struktúrát ad, a teljes sémához használd a Lovable Cloud felületét</li>
            <li>Az adatok exportálása tartalmazza az összes kiválasztott tábla tartalmát</li>
            <li>A képek és fájlok a storage bucket-ből külön letölthetők</li>
            <li>Részletes útmutató: <code className="bg-blue-800/50 px-1 rounded">docs/INDEPENDENT_HOSTING.md</code></li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Schema Export */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Séma Exportálás
            </CardTitle>
            <CardDescription className="text-gray-400">
              Tábla struktúrák, ENUM típusok, RLS szabályok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportSchema} 
              disabled={exportingSchema}
              className="w-full"
            >
              {exportingSchema ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportálás...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Séma letöltése</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Adatok Exportálása
            </CardTitle>
            <CardDescription className="text-gray-400">
              INSERT utasítások a kiválasztott táblákból
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportData} 
              disabled={exportingData || selectedTables.length === 0}
              className="w-full"
            >
              {exportingData ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportálás...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Adatok letöltése ({selectedTables.length} tábla)</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Table Selection */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Exportálandó táblák</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Mind</Button>
              <Button variant="outline" size="sm" onClick={selectNone}>Egyik sem</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {EXPORTABLE_TABLES.map((table) => (
              <div key={table.name} className="flex items-center space-x-2">
                <Checkbox
                  id={table.name}
                  checked={selectedTables.includes(table.name)}
                  onCheckedChange={() => toggleTable(table.name)}
                />
                <Label htmlFor={table.name} className="text-gray-300 text-sm cursor-pointer">
                  {table.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}