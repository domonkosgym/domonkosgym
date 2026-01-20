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

export default function DatabaseExport() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [allTables, setAllTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([]);

  useEffect(() => {
    fetchSchemaInfo();
  }, []);

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
      setSelectedTables(tableNames);
      
      toast.success(`${tableNames.length} tábla betöltve az adatbázisból`);
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

  const selectAll = () => setSelectedTables([...allTables]);
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
    sql += `-- Táblák száma: ${allTables.length}\n`;
    sql += `-- ============================================\n\n`;
    
    // Export ENUMs first
    if (schemaInfo.enums && schemaInfo.enums.length > 0) {
      sql += `-- ============================================\n`;
      sql += `-- ENUM TÍPUSOK\n`;
      sql += `-- ============================================\n\n`;
      
      for (const enumType of schemaInfo.enums) {
        const values = enumType.enum_values.map(v => `'${v}'`).join(', ');
        sql += `CREATE TYPE public.${enumType.enum_name} AS ENUM (${values});\n`;
      }
      sql += `\n`;
    }

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
    sql += `-- TÁBLA DEFINÍCIÓK (${allTables.length} tábla)\n`;
    sql += `-- ============================================\n\n`;

    // Export all tables
    for (const tableName of allTables) {
      const columns = tableColumns[tableName];
      if (!columns || columns.length === 0) continue;

      const tableLabel = TABLE_LABELS[tableName]?.label || tableName;
      sql += `-- ${tableLabel.toUpperCase()} (${tableName})\n`;
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
      
      // Add foreign key constraints
      const fks = foreignKeysByTable[tableName];
      if (fks && fks.length > 0) {
        for (const fk of fks) {
          columnDefs.push(`  CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column})`);
        }
      }
      
      sql += columnDefs.join(',\n');
      sql += `\n);\n\n`;
    }

    // Export RLS enable statements
    sql += `-- ============================================\n`;
    sql += `-- ROW LEVEL SECURITY ENGEDÉLYEZÉS\n`;
    sql += `-- ============================================\n\n`;

    for (const tableName of allTables) {
      sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n`;
    }
    sql += `\n`;

    // Export RLS policies
    if (schemaInfo.policies && schemaInfo.policies.length > 0) {
      sql += `-- ============================================\n`;
      sql += `-- RLS SZABÁLYOK (${schemaInfo.policies.length} policy)\n`;
      sql += `-- ============================================\n\n`;
      
      for (const policy of schemaInfo.policies) {
        sql += `-- Policy: ${policy.policy_name}\n`;
        sql += `CREATE POLICY "${policy.policy_name}"\n`;
        sql += `  ON ${policy.table_name}\n`;
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

    sql += `-- ============================================\n`;
    sql += `-- SÉMA EXPORT BEFEJEZVE\n`;
    sql += `-- Táblák: ${allTables.length}\n`;
    sql += `-- Enum típusok: ${schemaInfo.enums?.length || 0}\n`;
    sql += `-- RLS szabályok: ${schemaInfo.policies?.length || 0}\n`;
    sql += `-- ============================================\n`;

    downloadFile(sql, `adatbazis_sema_${new Date().toISOString().slice(0, 10)}.sql`);
    toast.success(`Séma exportálva: ${allTables.length} tábla, ${schemaInfo.enums?.length || 0} enum, ${schemaInfo.policies?.length || 0} RLS policy`);
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
          <p className="text-gray-400 mt-1">Teljes adatbázis export - minden tábla, minden adat</p>
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
          <AlertTitle>Séma betöltve</AlertTitle>
          <AlertDescription>
            {allTables.length} tábla, {schemaInfo.enums?.length || 0} enum típus, {schemaInfo.policies?.length || 0} RLS policy
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-900/20 border-blue-700">
        <Info className="h-4 w-4" />
        <AlertTitle>Független hosztoláshoz</AlertTitle>
        <AlertDescription>
          A séma export tartalmazza az összes CREATE TABLE, ENUM típust és RLS policy-t.
          Az adat export az INSERT utasításokat tartalmazza az összes kijelölt táblából.
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
              Teljes adatbázis struktúra: {allTables.length} tábla, enum típusok, RLS szabályok
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
              {selectedTables.length} / {allTables.length} tábla kijelölve
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
              {exportProgress.map(p => (
                <div 
                  key={p.tableName}
                  className={`p-2 rounded text-sm flex items-center gap-2 ${
                    p.status === 'done' ? 'bg-green-900/20 text-green-400' :
                    p.status === 'loading' ? 'bg-blue-900/20 text-blue-400' :
                    p.status === 'error' ? 'bg-red-900/20 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}
                >
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
                              className="text-sm cursor-pointer text-gray-300 truncate"
                              title={`${label} (${tableName})`}
                            >
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
