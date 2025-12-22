import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, Star, Info, ExternalLink, Copy } from "lucide-react";

interface Domain {
  id: string;
  domain_name: string;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export default function DomainsAdmin() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ domain_name: '', notes: '', is_primary: false, is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Hiba a domainek betöltésekor');
      console.error(error);
    } else {
      setDomains(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingDomain(null);
    setFormData({ domain_name: '', notes: '', is_primary: domains.length === 0, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      domain_name: domain.domain_name,
      notes: domain.notes || '',
      is_primary: domain.is_primary,
      is_active: domain.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.domain_name.trim()) {
      toast.error('Domain név megadása kötelező');
      return;
    }

    setSaving(true);

    // If setting as primary, unset other primaries first
    if (formData.is_primary) {
      await supabase
        .from('domains')
        .update({ is_primary: false })
        .neq('id', editingDomain?.id || '');
    }

    if (editingDomain) {
      const { error } = await supabase
        .from('domains')
        .update(formData)
        .eq('id', editingDomain.id);

      if (error) {
        toast.error('Hiba a mentéskor');
        console.error(error);
      } else {
        toast.success('Domain frissítve');
        setDialogOpen(false);
        fetchDomains();
      }
    } else {
      const { error } = await supabase
        .from('domains')
        .insert([formData]);

      if (error) {
        toast.error('Hiba a mentéskor');
        console.error(error);
      } else {
        toast.success('Domain hozzáadva');
        setDialogOpen(false);
        fetchDomains();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a domaint?')) return;

    const { error } = await supabase
      .from('domains')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Hiba a törléskor');
      console.error(error);
    } else {
      toast.success('Domain törölve');
      fetchDomains();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Vágólapra másolva');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const primaryDomain = domains.find(d => d.is_primary);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Domének</h1>
          <p className="text-gray-400 mt-1">Fő domain és átirányító domainek kezelése</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Új domain
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingDomain ? 'Domain szerkesztése' : 'Új domain hozzáadása'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-300">Domain név *</Label>
                <Input
                  value={formData.domain_name}
                  onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                  placeholder="pelda.hu"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Megjegyzés</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Opcionális megjegyzés..."
                  rows={2}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                />
                <Label className="text-gray-300">Fő domain (erre irányítanak át a többi domainek)</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-gray-300">Aktív</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Mégse</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* DNS Setup Instructions */}
      <Alert className="bg-blue-900/20 border-blue-700">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertTitle className="text-blue-300">Hogyan irányíts át több domaint erre a weboldalra?</AlertTitle>
        <AlertDescription className="text-blue-200/80 mt-2 space-y-2">
          <p>Minden domain szolgáltatónál (pl. MHosting) be kell állítanod a DNS rekordokat:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li><strong>A rekord</strong> a gyökér domainnél (@) → a szerver IP címére mutat</li>
            <li><strong>A rekord</strong> a www aldomain → ugyanarra az IP címre</li>
            <li>Vagy <strong>CNAME rekord</strong> a fő domainre irányítva</li>
          </ol>
          <p className="mt-3">A szervereden (pl. Apache/Nginx) be kell állítani a virtual host-ot, hogy minden domain ugyanazt az oldalt szolgálja ki.</p>
        </AlertDescription>
      </Alert>

      {/* Primary Domain Card */}
      {primaryDomain && (
        <Card className="bg-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary flex items-center gap-2">
              <Star className="w-5 h-5 fill-primary" />
              Fő Domain
            </CardTitle>
            <CardDescription className="text-primary/70">
              Minden más domain erre irányít át
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-white">{primaryDomain.domain_name}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(primaryDomain.domain_name)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(primaryDomain)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Domains */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Átirányító domainek</h2>
        {domains.filter(d => !d.is_primary).length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Globe className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Még nincsenek átirányító domainek</p>
              <p className="text-gray-500 text-sm mt-1">Add hozzá a többi domaint, amelyek erre az oldalra irányítanak</p>
            </CardContent>
          </Card>
        ) : (
          domains.filter(d => !d.is_primary).map((domain) => (
            <Card key={domain.id} className={`bg-gray-800/50 border-gray-700 ${!domain.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="font-medium text-white">{domain.domain_name}</span>
                      {domain.notes && (
                        <p className="text-sm text-gray-500">{domain.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${domain.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {domain.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(domain)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(domain.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* MHosting Specific Instructions */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            MHosting beállítási útmutató
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-3">
          <ol className="list-decimal list-inside space-y-2">
            <li>Jelentkezz be az MHosting fiókodba</li>
            <li>Menj a <strong>Domainek</strong> menüpontra</li>
            <li>Válaszd ki a beállítani kívánt domaint</li>
            <li>Kattints a <strong>DNS kezelés</strong> gombra</li>
            <li>Állítsd be az A rekordot a szerver IP címére</li>
            <li>Várj 24-48 órát a DNS propagációra</li>
          </ol>
          <p className="text-sm text-gray-500 mt-4">
            Ha a szervered már be van állítva, a domain automatikusan az oldaladra fog irányítani.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
