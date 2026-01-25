import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Database, FileCode, Info, Loader2, CheckCircle, RefreshCw } from "lucide-react";

interface TableColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface EnumType {
  enum_name: string;
  enum_values: string[];
}

interface RLSPolicy {
  table_name: string;
  policy_name: string;
  policy_command: string;
  policy_qual: string | null;
  policy_with_check: string | null;
}

interface ForeignKey {
  table_name: string;
  column_name: string;
  foreign_table: string;
  foreign_column: string;
  constraint_name: string;
}

interface PrimaryKey {
  table_name: string;
  column_name: string;
}

interface UniqueConstraint {
  table_name: string;
  constraint_name: string;
  column_names: string[];
}

interface SchemaInfo {
  tables: TableColumn[];
  enums: EnumType[];
  policies: RLSPolicy[];
  foreignKeys: ForeignKey[];
  primaryKeys: PrimaryKey[];
  uniqueConstraints: UniqueConstraint[];
}

interface ExportProgress {
  tableName: string;
  rowCount: number;
  status: 'pending' | 'loading' | 'done' | 'error';
}

const TABLE_LABELS: Record<string, { label: string; category: string }> = {
  'about_page': { label: 'Rólam oldal', category: 'content' },
  'about_sections': { label: 'Rólam szekciók', category: 'content' },
  'cms_settings': { label: 'CMS beállítások', category: 'content' },
  'faqs': { label: 'GYIK', category: 'content' },
  'featured_links': { label: 'Kiemelt linkek', category: 'content' },
  'landing_page_sections': { label: 'Főoldal szekciók', category: 'content' },
  'process_steps': { label: 'Folyamat lépések', category: 'content' },
  'site_images': { label: 'Oldal képek', category: 'content' },
  'theme_settings': { label: 'Téma beállítások', category: 'content' },
  'products': { label: 'Termékek', category: 'business' },
  'services': { label: 'Szolgáltatások', category: 'business' },
  'orders': { label: 'Rendelések', category: 'business' },
  'order_items': { label: 'Rendelés tételek', category: 'business' },
  'bookings': { label: 'Foglalások', category: 'business' },
  'invoices': { label: 'Számlák', category: 'business' },
  'digital_entitlements': { label: 'Digitális jogosultságok', category: 'business' },
  'availability_slots': { label: 'Elérhetőségi idősávok', category: 'config' },
  'blocked_time_slots': { label: 'Blokkolt időpontok', category: 'config' },
  'company_billing_info': { label: 'Céges adatok', category: 'config' },
  'domains': { label: 'Domainek', category: 'config' },
  'shipping_config': { label: 'Szállítási konfig', category: 'config' },
  'shipping_providers': { label: 'Szállítási szolgáltatók', category: 'config' },
  'szamlazz_settings': { label: 'Számlázz.hu beállítások', category: 'config' },
  'user_roles': { label: 'Felhasználói szerepkörök', category: 'auth' },
  'contacts': { label: 'Kapcsolatok', category: 'crm' },
  'leads': { label: 'Érdeklődők', category: 'crm' },
  'email_templates': { label: 'Email sablonok', category: 'email' },
  'email_campaigns': { label: 'Email kampányok', category: 'email' },
  'email_campaign_recipients': { label: 'Kampány címzettek', category: 'email' },
  'email_messages': { label: 'Email üzenetek', category: 'email' },
  'email_attachments': { label: 'Email csatolmányok', category: 'email' },
  'cta_clicks': { label: 'CTA kattintások', category: 'analytics' },
  'page_views': { label: 'Oldal megtekintések', category: 'analytics' },
  'session_metrics': { label: 'Munkamenet metrikák', category: 'analytics' },
  'form_interactions': { label: 'Form interakciók', category: 'analytics' },
  'lead_scores': { label: 'Lead pontszámok', category: 'analytics' },
};

// Database functions that DON'T depend on tables (safe to create early)
const DATABASE_FUNCTIONS_EARLY = `
-- ============================================
-- ALAP FÜGGVÉNYEK (NEM FÜGGNEK TÁBLÁKTÓL)
-- ============================================

-- Frissítési időbélyeg trigger függvény
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Felhasználó ID lekérése email alapján
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select id from auth.users where lower(email) = lower(_email) limit 1;
$function$;

`;

// Database functions that DEPEND on tables (must be created after tables)
const DATABASE_FUNCTIONS_LATE = `
-- ============================================
-- TÁBLA-FÜGGŐ FÜGGVÉNYEK (TÁBLÁK UTÁN KELL LÉTREHOZNI)
-- ============================================

-- Szerepkör ellenőrzése (függ: user_roles tábla)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Foglalási idősávok lekérdezése (függ: bookings tábla)
CREATE OR REPLACE FUNCTION public.get_booking_slots(p_service_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(service_id uuid, scheduled_date date, scheduled_time time without time zone, duration_minutes integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    b.service_id,
    b.scheduled_date,
    b.scheduled_time,
    b.duration_minutes
  FROM public.bookings b
  WHERE b.status IN ('pending', 'confirmed')
    AND (p_service_id IS NULL OR b.service_id = p_service_id);
$function$;

-- Admin felhasználó beállítása (függ: user_roles tábla)
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'domonkosgym@admin.local';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$function$;

-- Admin felhasználó beállítása email alapján (függ: user_roles tábla)
CREATE OR REPLACE FUNCTION public.setup_admin_user_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id from auth.users where lower(email) = lower(_email);
  if admin_user_id is not null then
    insert into public.user_roles (user_id, role)
    values (admin_user_id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;
end;
$function$;

`;

// Schema helper functions (only needed for admin panel, can be skipped on VPS)
const SCHEMA_HELPER_FUNCTIONS = `
-- ============================================
-- SÉMA SEGÉD FÜGGVÉNYEK (OPCIONÁLIS - ADMIN FELÜLETHEZ)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_all_table_info()
RETURNS TABLE(table_name text, column_name text, data_type text, udt_name text, is_nullable text, column_default text, ordinal_position integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer
  FROM information_schema.columns c
  JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
  WHERE c.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name, c.ordinal_position;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_enum_types()
RETURNS TABLE(enum_name text, enum_values text[])
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.typname::text as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder)::text[] as enum_values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY t.typname;
$function$;

CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(table_name text, policy_name text, policy_command text, policy_qual text, policy_with_check text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd::text as policy_command,
    qual::text as policy_qual,
    with_check::text as policy_with_check
  FROM pg_policies
  WHERE schemaname = 'public';
$function$;

CREATE OR REPLACE FUNCTION public.get_foreign_keys()
RETURNS TABLE(table_name text, column_name text, foreign_table text, foreign_column text, constraint_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table,
    ccu.column_name::text as foreign_column,
    tc.constraint_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
$function$;

CREATE OR REPLACE FUNCTION public.get_primary_keys()
RETURNS TABLE(table_name text, column_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.ordinal_position;
$function$;

CREATE OR REPLACE FUNCTION public.get_unique_constraints()
RETURNS TABLE(table_name text, constraint_name text, column_names text[])
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    tc.table_name::text,
    tc.constraint_name::text,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position)::text[] as column_names
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_schema = 'public'
  GROUP BY tc.table_name, tc.constraint_name;
$function$;

`;

export default function DatabaseExport() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [allTables, setAllTables] = useState<string[]>([]);
  const [orderedTables, setOrderedTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([]);

  useEffect(() => {
    fetchSchemaInfo();
  }, []);

  // Topological sort for table dependencies
  const topologicalSort = (tables: string[], foreignKeys: ForeignKey[]): string[] => {
    const graph: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    // Initialize
    for (const table of tables) {
      graph[table] = [];
      inDegree[table] = 0;
    }
    
    // Build dependency graph
    for (const fk of foreignKeys) {
      if (tables.includes(fk.table_name) && tables.includes(fk.foreign_table)) {
        // table_name depends on foreign_table
        if (fk.table_name !== fk.foreign_table) {
          graph[fk.foreign_table].push(fk.table_name);
          inDegree[fk.table_name]++;
        }
      }
    }
    
    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];
    
    // Start with tables that have no dependencies
    for (const table of tables) {
      if (inDegree[table] === 0) {
        queue.push(table);
      }
    }
    
    while (queue.length > 0) {
      // Sort queue alphabetically for consistent ordering
      queue.sort();
      const current = queue.shift()!;
      result.push(current);
      
      for (const dependent of graph[current]) {
        inDegree[dependent]--;
        if (inDegree[dependent] === 0) {
          queue.push(dependent);
        }
      }
    }
    
    // If there are remaining tables (circular dependencies), add them at the end
    for (const table of tables) {
      if (!result.includes(table)) {
        result.push(table);
      }
    }
    
    return result;
  };

  const fetchSchemaInfo = async () => {
    setLoadingSchema(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-schema-info');
      
      if (error) {
        console.error('Schema fetch error:', error);
        toast.error('Hiba a séma lekérdezésekor');
        return;
      }

      setSchemaInfo(data);
      
      // Extract unique table names
      const tableNames = [...new Set(data.tables.map((t: TableColumn) => t.table_name))].sort() as string[];
      setAllTables(tableNames);
      
      // Sort tables by dependencies
      const sorted = topologicalSort(tableNames, data.foreignKeys || []);
      setOrderedTables(sorted);
      setSelectedTables(sorted);
      
      console.log('Table order for export:', sorted);
      toast.success(`${tableNames.length} tábla betöltve (függőség szerint rendezve)`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Nem sikerült a séma lekérdezése');
    } finally {
      setLoadingSchema(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => setSelectedTables([...orderedTables]);
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
    const escaped = String(value)
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `E'${escaped}'`;
  };

  const fetchAllRows = async (tableName: string): Promise<Record<string, unknown>[]> => {
    const allRows: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName as 'about_page')
        .select('*')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allRows.push(...(data as Record<string, unknown>[]));
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  };

  // Get tables in correct order for data export (respecting foreign keys)
  const getOrderedSelectedTables = (): string[] => {
    return orderedTables.filter(t => selectedTables.includes(t));
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error('Válassz ki legalább egy táblát');
      return;
    }

    setExportingData(true);
    
    // Use dependency-ordered tables
    const tablesToExport = getOrderedSelectedTables();
    
    setExportProgress(tablesToExport.map(t => ({ tableName: t, rowCount: 0, status: 'pending' })));
    
    let sql = `-- ============================================\n`;
    sql += `-- TELJES ADATBÁZIS ADAT EXPORT\n`;
    sql += `-- Dátum: ${new Date().toISOString()}\n`;
    sql += `-- Táblák száma: ${tablesToExport.length}\n`;
    sql += `-- FONTOS: A táblák függőségi sorrendben vannak!\n`;
    sql += `-- ============================================\n\n`;

    sql += `-- Ideiglenesen kikapcsoljuk a foreign key ellenőrzést\n`;
    sql += `SET session_replication_role = 'replica';\n\n`;

    let totalRows = 0;

    try {
      for (let i = 0; i < tablesToExport.length; i++) {
        const tableName = tablesToExport[i];
        
        setExportProgress(prev => prev.map(p => 
          p.tableName === tableName ? { ...p, status: 'loading' } : p
        ));

        try {
          const data = await fetchAllRows(tableName);

          if (data && data.length > 0) {
            sql += `-- ============================================\n`;
            sql += `-- TÁBLA: ${tableName} (${i + 1}/${tablesToExport.length})\n`;
            sql += `-- SOROK SZÁMA: ${data.length}\n`;
            sql += `-- ============================================\n\n`;
            
            sql += `-- Trigger letiltás\n`;
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

      sql += `\n-- Foreign key ellenőrzés visszakapcsolása\n`;
      sql += `SET session_replication_role = 'origin';\n\n`;

      sql += `-- ============================================\n`;
      sql += `-- EXPORT BEFEJEZVE\n`;
      sql += `-- Összesen: ${totalRows} sor\n`;
      sql += `-- ============================================\n`;

      downloadFile(sql, `teljes_adatbazis_export_${new Date().toISOString().slice(0, 10)}.sql`);
      toast.success(`Exportálva: ${totalRows} sor, ${tablesToExport.length} tábla`);
    } catch (error) {
      console.error('Export hiba:', error);
      toast.error('Hiba az exportálás során');
    }

    setExportingData(false);
  };

  const mapPostgresType = (dataType: string, udtName: string): string => {
    // Check if it's an enum type
    if (schemaInfo?.enums.some(e => e.enum_name === udtName)) {
      return `public.${udtName}`;
    }
    
    // Check for arrays
    if (dataType === 'ARRAY') {
      const baseType = udtName.startsWith('_') ? udtName.substring(1) : udtName;
      return `${baseType}[]`;
    }
    
    // Map common types
    const typeMap: Record<string, string> = {
      'uuid': 'uuid',
      'text': 'text',
      'boolean': 'boolean',
      'integer': 'integer',
      'bigint': 'bigint',
      'numeric': 'numeric',
      'timestamp with time zone': 'timestamp with time zone',
      'timestamp without time zone': 'timestamp without time zone',
      'date': 'date',
      'time without time zone': 'time without time zone',
      'time with time zone': 'time with time zone',
      'jsonb': 'jsonb',
      'json': 'json',
      'bytea': 'bytea',
      'inet': 'inet',
      'real': 'real',
      'double precision': 'double precision',
      'smallint': 'smallint',
    };
    
    return typeMap[dataType] || udtName || dataType;
  };

  const exportSchema = async () => {
    if (!schemaInfo) {
      toast.error('Először töltsd be a sémát');
      return;
    }

    setExportingSchema(true);

    let sql = `-- ============================================\n`;
    sql += `-- TELJES ADATBÁZIS SÉMA EXPORT\n`;
    sql += `-- Dátum: ${new Date().toISOString()}\n`;
    sql += `-- Táblák száma: ${orderedTables.length}\n`;
    sql += `-- FONTOS: A táblák függőségi sorrendben vannak!\n`;
    sql += `-- ============================================\n\n`;

    sql += `-- Szükséges extension-ök\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;
    
    // Export ENUMs first
    if (schemaInfo.enums && schemaInfo.enums.length > 0) {
      sql += `-- ============================================\n`;
      sql += `-- ENUM TÍPUSOK (ELSŐKÉNT KELL LÉTREHOZNI)\n`;
      sql += `-- ============================================\n\n`;
      
      for (const enumType of schemaInfo.enums) {
        const values = enumType.enum_values.map(v => `'${v}'`).join(', ');
        sql += `DO $$ BEGIN\n`;
        sql += `  CREATE TYPE public.${enumType.enum_name} AS ENUM (${values});\n`;
        sql += `EXCEPTION WHEN duplicate_object THEN NULL;\n`;
        sql += `END $$;\n\n`;
      }
    }

    // Add early database functions (don't depend on tables)
    sql += DATABASE_FUNCTIONS_EARLY;
    sql += `\n`;

    // Group columns by table
    const tableColumns: Record<string, TableColumn[]> = {};
    for (const col of schemaInfo.tables) {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    }

    // Sort columns by ordinal position
    for (const tableName of Object.keys(tableColumns)) {
      tableColumns[tableName].sort((a, b) => a.ordinal_position - b.ordinal_position);
    }

    // Get primary keys by table
    const primaryKeysByTable: Record<string, string[]> = {};
    if (schemaInfo.primaryKeys) {
      for (const pk of schemaInfo.primaryKeys) {
        if (!primaryKeysByTable[pk.table_name]) {
          primaryKeysByTable[pk.table_name] = [];
        }
        primaryKeysByTable[pk.table_name].push(pk.column_name);
      }
    }

    // Get foreign keys by table
    const foreignKeysByTable: Record<string, ForeignKey[]> = {};
    if (schemaInfo.foreignKeys) {
      for (const fk of schemaInfo.foreignKeys) {
        if (!foreignKeysByTable[fk.table_name]) {
          foreignKeysByTable[fk.table_name] = [];
        }
        foreignKeysByTable[fk.table_name].push(fk);
      }
    }

    sql += `-- ============================================\n`;
    sql += `-- TÁBLA DEFINÍCIÓK (${orderedTables.length} tábla, FÜGGŐSÉGI SORRENDBEN)\n`;
    sql += `-- ============================================\n\n`;

    // Export tables in dependency order (WITHOUT foreign keys first)
    for (let i = 0; i < orderedTables.length; i++) {
      const tableName = orderedTables[i];
      const columns = tableColumns[tableName];
      if (!columns || columns.length === 0) continue;

      const tableLabel = TABLE_LABELS[tableName]?.label || tableName;
      sql += `-- ${i + 1}. ${tableLabel.toUpperCase()} (${tableName})\n`;
      sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
      
      const columnDefs: string[] = [];
      
      for (const col of columns) {
        let colDef = `  ${col.column_name} ${mapPostgresType(col.data_type, col.udt_name)}`;
        
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
        
        if (col.column_default) {
          // Clean up default value
          let defaultVal = col.column_default;
          // Remove schema prefix if present
          defaultVal = defaultVal.replace(/extensions\./g, '');
          colDef += ` DEFAULT ${defaultVal}`;
        }
        
        columnDefs.push(colDef);
      }
      
      // Add primary key constraint
      const pks = primaryKeysByTable[tableName];
      if (pks && pks.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${pks.join(', ')})`);
      }
      
      sql += columnDefs.join(',\n');
      sql += `\n);\n\n`;
    }

    // Now add foreign key constraints separately (after all tables exist)
    sql += `-- ============================================\n`;
    sql += `-- FOREIGN KEY CONSTRAINTS (TÁBLÁK UTÁN)\n`;
    sql += `-- ============================================\n\n`;

    for (const tableName of orderedTables) {
      const fks = foreignKeysByTable[tableName];
      if (fks && fks.length > 0) {
        for (const fk of fks) {
          sql += `ALTER TABLE public.${tableName} ADD CONSTRAINT ${fk.constraint_name} `;
          sql += `FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column});\n`;
        }
      }
    }
    sql += `\n`;

    // Export unique constraints
    if (schemaInfo.uniqueConstraints && schemaInfo.uniqueConstraints.length > 0) {
      sql += `-- ============================================\n`;
      sql += `-- UNIQUE CONSTRAINTS\n`;
      sql += `-- ============================================\n\n`;
      
      for (const uc of schemaInfo.uniqueConstraints) {
        sql += `ALTER TABLE public.${uc.table_name} ADD CONSTRAINT ${uc.constraint_name} UNIQUE (${uc.column_names.join(', ')});\n`;
      }
      sql += `\n`;
    }

    // Add table-dependent functions AFTER tables are created
    sql += DATABASE_FUNCTIONS_LATE;
    sql += `\n`;

    // Add optional schema helper functions
    sql += SCHEMA_HELPER_FUNCTIONS;
    sql += `\n`;

    // Export RLS enable statements
    sql += `-- ============================================\n`;
    sql += `-- ROW LEVEL SECURITY ENGEDÉLYEZÉS\n`;
    sql += `-- ============================================\n\n`;

    for (const tableName of orderedTables) {
      sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n`;
    }
    sql += `\n`;

    // Export RLS policies
    if (schemaInfo.policies && schemaInfo.policies.length > 0) {
      sql += `-- ============================================\n`;
      sql += `-- RLS SZABÁLYOK (${schemaInfo.policies.length} policy)\n`;
      sql += `-- ============================================\n\n`;
      
      for (const policy of schemaInfo.policies) {
        // Extract just the table name from "public.tablename"
        const tableName = policy.table_name.replace('public.', '');
        
        sql += `-- Policy: ${policy.policy_name}\n`;
        sql += `CREATE POLICY "${policy.policy_name}"\n`;
        sql += `  ON public.${tableName}\n`;
        sql += `  FOR ${policy.policy_command}\n`;
        
        if (policy.policy_qual) {
          sql += `  USING (${policy.policy_qual})\n`;
        }
        
        if (policy.policy_with_check) {
          sql += `  WITH CHECK (${policy.policy_with_check})\n`;
        }
        
        sql += `;\n\n`;
      }
    }

    sql += `-- ============================================\n`;
    sql += `-- SÉMA EXPORT BEFEJEZVE\n`;
    sql += `-- Táblák: ${orderedTables.length}\n`;
    sql += `-- Enum típusok: ${schemaInfo.enums?.length || 0}\n`;
    sql += `-- RLS szabályok: ${schemaInfo.policies?.length || 0}\n`;
    sql += `-- Függvények: 10\n`;
    sql += `-- ============================================\n`;

    downloadFile(sql, `adatbazis_sema_${new Date().toISOString().slice(0, 10)}.sql`);
    toast.success(`Séma exportálva: ${orderedTables.length} tábla, ${schemaInfo.enums?.length || 0} enum, ${schemaInfo.policies?.length || 0} RLS policy, 10 függvény`);
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
    { key: 'other', label: 'Egyéb', color: 'text-gray-400' },
  ];

  const getTablesByCategory = (categoryKey: string) => {
    return allTables.filter(tableName => {
      const info = TABLE_LABELS[tableName];
      if (categoryKey === 'other') {
        return !info;
      }
      return info?.category === categoryKey;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Adatbázis Exportálás</h1>
          <p className="text-gray-400 mt-1">Teljes adatbázis export - függőségi sorrendben</p>
        </div>
        <Button
          onClick={fetchSchemaInfo}
          disabled={loadingSchema}
          variant="outline"
          className="gap-2"
        >
          {loadingSchema ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Séma frissítése
        </Button>
      </div>

      {loadingSchema && (
        <Alert className="bg-blue-900/20 border-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Séma betöltése...</AlertTitle>
          <AlertDescription>Táblák és struktúra lekérdezése az adatbázisból...</AlertDescription>
        </Alert>
      )}

      {schemaInfo && (
        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertTitle>Séma betöltve - Függőségi sorrendben</AlertTitle>
          <AlertDescription>
            {allTables.length} tábla, {schemaInfo.enums?.length || 0} enum típus, {schemaInfo.policies?.length || 0} RLS policy, {schemaInfo.foreignKeys?.length || 0} foreign key
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-900/20 border-blue-700">
        <Info className="h-4 w-4" />
        <AlertTitle>Független hosztoláshoz - Javított verzió</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>A táblák <strong>topológiai sorrendben</strong> kerülnek exportálásra (függőségek figyelembevételével)</li>
            <li>Enum típusok és függvények <strong>elsőként</strong> jönnek létre</li>
            <li>Foreign key constraint-ek <strong>külön</strong>, a táblák létrehozása után</li>
            <li>Data export: session_replication_role a FK ellenőrzés kikapcsolásához</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schema Export */}
        <Card className="bg-[#1a1a2e] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileCode className="h-5 w-5 text-blue-400" />
              Séma Letöltése
            </CardTitle>
            <CardDescription>
              Teljes adatbázis struktúra: {allTables.length} tábla, enum típusok, függvények, RLS szabályok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportSchema} 
              disabled={exportingSchema || loadingSchema || !schemaInfo}
              className="w-full gap-2"
            >
              {exportingSchema ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportingSchema ? 'Exportálás...' : 'Séma Letöltése (.sql)'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-[#1a1a2e] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-green-400" />
              Teljes Adatok Exportálása
            </CardTitle>
            <CardDescription>
              {selectedTables.length} / {allTables.length} tábla kijelölve (függőségi sorrendben)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportData} 
              disabled={exportingData || selectedTables.length === 0 || loadingSchema}
              className="w-full gap-2"
            >
              {exportingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportingData ? 'Exportálás...' : 'Adatok Letöltése (.sql)'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Progress */}
      {exportProgress.length > 0 && (
        <Card className="bg-[#1a1a2e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Export Folyamat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {exportProgress.map((p, idx) => (
                <div 
                  key={p.tableName}
                  className={`p-2 rounded text-sm flex items-center gap-2 ${
                    p.status === 'done' ? 'bg-green-900/20 text-green-400' :
                    p.status === 'loading' ? 'bg-blue-900/20 text-blue-400' :
                    p.status === 'error' ? 'bg-red-900/20 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}
                >
                  <span className="text-xs text-gray-500">{idx + 1}.</span>
                  {p.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {p.status === 'done' && <CheckCircle className="h-3 w-3" />}
                  <span className="truncate">{p.tableName}</span>
                  {p.status === 'done' && <span className="text-xs">({p.rowCount})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Selection */}
      <Card className="bg-[#1a1a2e] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Exportálandó Táblák ({allTables.length} tábla az adatbázisban)</CardTitle>
              <CardDescription>
                Válaszd ki, mely táblákat szeretnéd exportálni az adat exporthoz
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Mind kijelölése
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Kijelölés törlése
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSchema ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map(category => {
                const tables = getTablesByCategory(category.key);
                if (tables.length === 0) return null;

                return (
                  <div key={category.key}>
                    <h3 className={`text-sm font-medium mb-3 ${category.color}`}>
                      {category.label} ({tables.length} tábla)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {tables.map(tableName => {
                        const label = TABLE_LABELS[tableName]?.label || tableName;
                        const orderIndex = orderedTables.indexOf(tableName) + 1;
                        return (
                          <div 
                            key={tableName}
                            className="flex items-center space-x-2 bg-gray-800/50 p-2 rounded"
                          >
                            <Checkbox
                              id={tableName}
                              checked={selectedTables.includes(tableName)}
                              onCheckedChange={() => toggleTable(tableName)}
                            />
                            <Label 
                              htmlFor={tableName} 
                              className="text-sm cursor-pointer text-gray-300 truncate flex-1"
                              title={`${label} (${tableName}) - Sorrend: ${orderIndex}`}
                            >
                              <span className="text-xs text-gray-500 mr-1">{orderIndex}.</span>
                              {label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
