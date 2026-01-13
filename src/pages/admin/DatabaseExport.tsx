import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Database, FileCode, Info, Loader2, CheckCircle } from "lucide-react";

const EXPORTABLE_TABLES = [
  // Content tables
  { name: 'about_page', label: 'Rólam oldal', category: 'content' },
  { name: 'about_sections', label: 'Rólam szekciók', category: 'content' },
  { name: 'cms_settings', label: 'CMS beállítások', category: 'content' },
  { name: 'faqs', label: 'GYIK', category: 'content' },
  { name: 'featured_links', label: 'Kiemelt linkek', category: 'content' },
  { name: 'landing_page_sections', label: 'Főoldal szekciók', category: 'content' },
  { name: 'process_steps', label: 'Folyamat lépések', category: 'content' },
  { name: 'site_images', label: 'Oldal képek', category: 'content' },
  { name: 'theme_settings', label: 'Téma beállítások', category: 'content' },
  
  // Business tables
  { name: 'products', label: 'Termékek', category: 'business' },
  { name: 'services', label: 'Szolgáltatások', category: 'business' },
  { name: 'orders', label: 'Rendelések', category: 'business' },
  { name: 'order_items', label: 'Rendelés tételek', category: 'business' },
  { name: 'bookings', label: 'Foglalások', category: 'business' },
  { name: 'invoices', label: 'Számlák', category: 'business' },
  { name: 'digital_entitlements', label: 'Digitális jogosultságok', category: 'business' },
  
  // Configuration tables
  { name: 'availability_slots', label: 'Elérhetőségi idősávok', category: 'config' },
  { name: 'blocked_time_slots', label: 'Blokkolt időpontok', category: 'config' },
  { name: 'company_billing_info', label: 'Céges adatok', category: 'config' },
  { name: 'domains', label: 'Domainek', category: 'config' },
  { name: 'shipping_config', label: 'Szállítási konfig', category: 'config' },
  { name: 'shipping_providers', label: 'Szállítási szolgáltatók', category: 'config' },
  { name: 'szamlazz_settings', label: 'Számlázz.hu beállítások', category: 'config' },
  
  // User & Auth tables
  { name: 'user_roles', label: 'Felhasználói szerepkörök', category: 'auth' },
  { name: 'contacts', label: 'Kapcsolatok', category: 'crm' },
  { name: 'leads', label: 'Érdeklődők', category: 'crm' },
  
  // Email tables
  { name: 'email_templates', label: 'Email sablonok', category: 'email' },
  { name: 'email_campaigns', label: 'Email kampányok', category: 'email' },
  { name: 'email_campaign_recipients', label: 'Kampány címzettek', category: 'email' },
  { name: 'email_messages', label: 'Email üzenetek', category: 'email' },
  { name: 'email_attachments', label: 'Email csatolmányok', category: 'email' },
  
  // Analytics tables
  { name: 'cta_clicks', label: 'CTA kattintások', category: 'analytics' },
  { name: 'page_views', label: 'Oldal megtekintések', category: 'analytics' },
  { name: 'session_metrics', label: 'Munkamenet metrikák', category: 'analytics' },
  { name: 'form_interactions', label: 'Form interakciók', category: 'analytics' },
  { name: 'lead_scores', label: 'Lead pontszámok', category: 'analytics' },
];

interface ExportProgress {
  tableName: string;
  rowCount: number;
  status: 'pending' | 'loading' | 'done' | 'error';
}

export default function DatabaseExport() {
  const [selectedTables, setSelectedTables] = useState<string[]>(EXPORTABLE_TABLES.map(t => t.name));
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([]);

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
      if (value.length === 0) return "'{}'";
      return `ARRAY[${value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')}]`;
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    // Escape newlines and special characters
    const escaped = String(value)
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `E'${escaped}'`;
  };

  const fetchAllRows = async (tableName: string): Promise<any[]> => {
    const allRows: any[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allRows.push(...data);
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error('Válassz ki legalább egy táblát');
      return;
    }

    setExportingData(true);
    setExportProgress(selectedTables.map(t => ({ tableName: t, rowCount: 0, status: 'pending' })));
    
    let sql = `-- ============================================\n`;
    sql += `-- TELJES ADATBÁZIS EXPORT\n`;
    sql += `-- Dátum: ${new Date().toISOString()}\n`;
    sql += `-- Táblák száma: ${selectedTables.length}\n`;
    sql += `-- ============================================\n\n`;

    let totalRows = 0;

    try {
      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        
        setExportProgress(prev => prev.map(p => 
          p.tableName === tableName ? { ...p, status: 'loading' } : p
        ));

        try {
          const data = await fetchAllRows(tableName);

          if (data && data.length > 0) {
            sql += `-- ============================================\n`;
            sql += `-- TÁBLA: ${tableName}\n`;
            sql += `-- SOROK SZÁMA: ${data.length}\n`;
            sql += `-- ============================================\n\n`;
            
            // Disable triggers and constraints for faster import
            sql += `-- Ideiglenes trigger letiltás\n`;
            sql += `ALTER TABLE public.${tableName} DISABLE TRIGGER ALL;\n\n`;
            
            for (const row of data) {
              const columns = Object.keys(row);
              const values = columns.map(col => escapeValue(row[col]));
              sql += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            }
            
            sql += `\n-- Trigger visszakapcsolása\n`;
            sql += `ALTER TABLE public.${tableName} ENABLE TRIGGER ALL;\n\n`;

            totalRows += data.length;
            
            setExportProgress(prev => prev.map(p => 
              p.tableName === tableName ? { ...p, rowCount: data.length, status: 'done' } : p
            ));
          } else {
            sql += `-- ${tableName}: Üres tábla\n\n`;
            setExportProgress(prev => prev.map(p => 
              p.tableName === tableName ? { ...p, rowCount: 0, status: 'done' } : p
            ));
          }
        } catch (tableError) {
          console.error(`Hiba a ${tableName} tábla lekérdezésekor:`, tableError);
          sql += `-- HIBA: ${tableName} tábla nem elérhető\n\n`;
          setExportProgress(prev => prev.map(p => 
            p.tableName === tableName ? { ...p, status: 'error' } : p
          ));
        }
      }

      sql += `\n-- ============================================\n`;
      sql += `-- EXPORT BEFEJEZVE\n`;
      sql += `-- Összesen: ${totalRows} sor\n`;
      sql += `-- ============================================\n`;

      downloadFile(sql, `teljes_adatbazis_export_${new Date().toISOString().slice(0, 10)}.sql`);
      toast.success(`Exportálva: ${totalRows} sor, ${selectedTables.length} tábla`);
    } catch (error) {
      console.error('Export hiba:', error);
      toast.error('Hiba az exportálás során');
    }

    setExportingData(false);
  };

  const exportSchema = async () => {
    setExportingSchema(true);

    let sql = `-- ============================================\n`;
    sql += `-- ADATBÁZIS SÉMA EXPORT\n`;
    sql += `-- Dátum: ${new Date().toISOString()}\n`;
    sql += `-- ============================================\n\n`;
    
    sql += `-- ENUM típusok\n`;
    sql += `CREATE TYPE public.app_role AS ENUM ('admin', 'user');\n`;
    sql += `CREATE TYPE public.order_status AS ENUM ('NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');\n`;
    sql += `CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');\n`;
    sql += `CREATE TYPE public.product_type AS ENUM ('DIGITAL', 'PHYSICAL');\n`;
    sql += `CREATE TYPE public.shipping_method AS ENUM ('HOME', 'BOX', 'NONE');\n\n`;

    sql += `-- ============================================\n`;
    sql += `-- TÁBLA DEFINÍCIÓK\n`;
    sql += `-- ============================================\n\n`;

    // Products table
    sql += `-- PRODUCTS\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.products (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  title_hu text NOT NULL,\n`;
    sql += `  title_en text NOT NULL,\n`;
    sql += `  title_es text NOT NULL,\n`;
    sql += `  subtitle_hu text,\n`;
    sql += `  subtitle_en text,\n`;
    sql += `  subtitle_es text,\n`;
    sql += `  description_hu text NOT NULL,\n`;
    sql += `  description_en text NOT NULL,\n`;
    sql += `  description_es text NOT NULL,\n`;
    sql += `  excerpt_hu text,\n`;
    sql += `  excerpt_en text,\n`;
    sql += `  excerpt_es text,\n`;
    sql += `  price_gross numeric NOT NULL,\n`;
    sql += `  sale_price numeric,\n`;
    sql += `  currency text NOT NULL DEFAULT 'HUF',\n`;
    sql += `  product_type product_type NOT NULL DEFAULT 'DIGITAL',\n`;
    sql += `  cover_image_url text,\n`;
    sql += `  file_asset_url text,\n`;
    sql += `  gallery_images text[] DEFAULT '{}',\n`;
    sql += `  is_featured boolean DEFAULT false,\n`;
    sql += `  is_on_sale boolean DEFAULT false,\n`;
    sql += `  is_active boolean DEFAULT true,\n`;
    sql += `  sort_order integer DEFAULT 0,\n`;
    sql += `  sale_from timestamp with time zone,\n`;
    sql += `  sale_to timestamp with time zone,\n`;
    sql += `  created_at timestamp with time zone DEFAULT now(),\n`;
    sql += `  updated_at timestamp with time zone DEFAULT now()\n`;
    sql += `);\n\n`;

    // Services table
    sql += `-- SERVICES\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.services (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  name text NOT NULL,\n`;
    sql += `  description text NOT NULL,\n`;
    sql += `  price numeric NOT NULL,\n`;
    sql += `  sale_price numeric,\n`;
    sql += `  is_on_sale boolean NOT NULL DEFAULT false,\n`;
    sql += `  category text NOT NULL,\n`;
    sql += `  slug text NOT NULL,\n`;
    sql += `  image_url text,\n`;
    sql += `  featured boolean NOT NULL DEFAULT false,\n`;
    sql += `  active boolean NOT NULL DEFAULT true,\n`;
    sql += `  sort_order integer NOT NULL DEFAULT 0,\n`;
    sql += `  created_at timestamp with time zone NOT NULL DEFAULT now(),\n`;
    sql += `  updated_at timestamp with time zone NOT NULL DEFAULT now()\n`;
    sql += `);\n\n`;

    // Orders table
    sql += `-- ORDERS\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.orders (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  customer_name text NOT NULL,\n`;
    sql += `  customer_email text NOT NULL,\n`;
    sql += `  customer_phone text,\n`;
    sql += `  status order_status NOT NULL DEFAULT 'NEW',\n`;
    sql += `  payment_status payment_status NOT NULL DEFAULT 'PENDING',\n`;
    sql += `  total_amount numeric NOT NULL,\n`;
    sql += `  shipping_amount numeric DEFAULT 0,\n`;
    sql += `  shipping_method shipping_method NOT NULL DEFAULT 'NONE',\n`;
    sql += `  currency text NOT NULL DEFAULT 'HUF',\n`;
    sql += `  shipping_country text,\n`;
    sql += `  shipping_postal_code text,\n`;
    sql += `  shipping_city text,\n`;
    sql += `  shipping_address text,\n`;
    sql += `  billing_same_as_shipping boolean DEFAULT true,\n`;
    sql += `  billing_name text,\n`;
    sql += `  billing_country text DEFAULT 'Magyarország',\n`;
    sql += `  billing_postal_code text,\n`;
    sql += `  billing_city text,\n`;
    sql += `  billing_address text,\n`;
    sql += `  box_provider text,\n`;
    sql += `  box_point_id text,\n`;
    sql += `  box_point_label text,\n`;
    sql += `  notes text,\n`;
    sql += `  created_at timestamp with time zone DEFAULT now(),\n`;
    sql += `  updated_at timestamp with time zone DEFAULT now()\n`;
    sql += `);\n\n`;

    // Bookings table
    sql += `-- BOOKINGS\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.bookings (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  service_id uuid NOT NULL REFERENCES public.services(id),\n`;
    sql += `  customer_name text NOT NULL,\n`;
    sql += `  customer_email text NOT NULL,\n`;
    sql += `  customer_phone text,\n`;
    sql += `  scheduled_date date NOT NULL,\n`;
    sql += `  scheduled_time time NOT NULL,\n`;
    sql += `  duration_minutes integer NOT NULL DEFAULT 30,\n`;
    sql += `  price numeric NOT NULL DEFAULT 0,\n`;
    sql += `  status text NOT NULL DEFAULT 'pending',\n`;
    sql += `  paid boolean DEFAULT false,\n`;
    sql += `  billing_address text,\n`;
    sql += `  notes text,\n`;
    sql += `  reschedule_count integer NOT NULL DEFAULT 0,\n`;
    sql += `  created_at timestamp with time zone NOT NULL DEFAULT now(),\n`;
    sql += `  updated_at timestamp with time zone NOT NULL DEFAULT now()\n`;
    sql += `);\n\n`;

    // Digital entitlements
    sql += `-- DIGITAL ENTITLEMENTS\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.digital_entitlements (\n`;
    sql += `  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    sql += `  order_id uuid NOT NULL REFERENCES public.orders(id),\n`;
    sql += `  product_id uuid NOT NULL REFERENCES public.products(id),\n`;
    sql += `  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),\n`;
    sql += `  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '72 hours'),\n`;
    sql += `  download_count integer DEFAULT 0,\n`;
    sql += `  max_downloads integer DEFAULT 10,\n`;
    sql += `  created_at timestamp with time zone DEFAULT now()\n`;
    sql += `);\n\n`;

    sql += `-- ============================================\n`;
    sql += `-- RLS SZABÁLYOK\n`;
    sql += `-- ============================================\n\n`;

    sql += `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE public.digital_entitlements ENABLE ROW LEVEL SECURITY;\n\n`;

    sql += `-- Példa RLS policy\n`;
    sql += `CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);\n`;
    sql += `CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));\n\n`;

    sql += `-- ============================================\n`;
    sql += `-- TELJES SÉMA: supabase/migrations/ mappában\n`;
    sql += `-- ============================================\n`;

    downloadFile(sql, `adatbazis_sema_${new Date().toISOString().slice(0, 10)}.sql`);
    toast.success('Séma exportálva');
    setExportingSchema(false);
  };

  const categories = [
    { key: 'content', label: 'Tartalom', color: 'text-blue-400' },
    { key: 'business', label: 'Üzleti adatok', color: 'text-green-400' },
    { key: 'config', label: 'Konfiguráció', color: 'text-purple-400' },
    { key: 'auth', label: 'Jogosultságok', color: 'text-yellow-400' },
    { key: 'crm', label: 'CRM', color: 'text-orange-400' },
    { key: 'email', label: 'Email', color: 'text-pink-400' },
    { key: 'analytics', label: 'Analitika', color: 'text-cyan-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Adatbázis Exportálás</h1>
        <p className="text-gray-400 mt-1">Teljes adatbázis export - minden adat, minden sor</p>
      </div>

      <Alert className="bg-blue-900/20 border-blue-700">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertTitle className="text-blue-300">Teljes Export Funkció</AlertTitle>
        <AlertDescription className="text-blue-200/80 mt-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Minden kiválasztott tábla <strong>összes sora</strong> exportálva lesz</li>
            <li>Nincs limit - több ezer sor is letöltődik</li>
            <li>SQL formátum - közvetlenül importálható bármely PostgreSQL adatbázisba</li>
            <li>Részletes dokumentáció: <code className="bg-blue-800/50 px-1 rounded">docs/INDEPENDENT_HOSTING.md</code></li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Export Progress */}
      {exportingData && exportProgress.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Export folyamat...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              {exportProgress.map((p) => (
                <div key={p.tableName} className={`flex items-center gap-2 p-2 rounded ${
                  p.status === 'done' ? 'bg-green-900/20' : 
                  p.status === 'loading' ? 'bg-blue-900/20' : 
                  p.status === 'error' ? 'bg-red-900/20' : 
                  'bg-gray-700/20'
                }`}>
                  {p.status === 'loading' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                  {p.status === 'done' && <CheckCircle className="w-3 h-3 text-green-400" />}
                  <span className="text-gray-300 truncate">{p.tableName}</span>
                  {p.status === 'done' && <span className="text-gray-500 text-xs">({p.rowCount})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              Teljes Adatok Exportálása
            </CardTitle>
            <CardDescription className="text-gray-400">
              Minden sor, minden adat - korlátok nélkül
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

      {/* Table Selection by Category */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Exportálandó táblák</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Mind kijelöl</Button>
              <Button variant="outline" size="sm" onClick={selectNone}>Összes törlése</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((cat) => {
            const tables = EXPORTABLE_TABLES.filter(t => t.category === cat.key);
            if (tables.length === 0) return null;
            
            return (
              <div key={cat.key}>
                <h3 className={`text-sm font-semibold mb-3 ${cat.color}`}>{cat.label}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tables.map((table) => (
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
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
