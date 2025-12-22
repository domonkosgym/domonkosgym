import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Truck, Package, Gift, Save, Plus, Pencil, Trash2 } from "lucide-react";

interface ShippingConfig {
  id: string;
  base_fee: number;
  box_fee: number;
  currency: string;
  free_shipping_threshold: number | null;
}

interface ShippingProvider {
  id: string;
  name: string;
  provider_type: string;
  fee: number;
  is_active: boolean;
  sort_order: number;
}

export default function ShippingAdmin() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currency, setCurrency] = useState('HUF');
  const [freeThreshold, setFreeThreshold] = useState<number | null>(null);

  // Provider dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    provider_type: 'HOME' as string,
    fee: 0,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [configResult, providersResult] = await Promise.all([
      supabase.from('shipping_config').select('*').limit(1).maybeSingle(),
      supabase.from('shipping_providers').select('*').order('sort_order')
    ]);

    if (configResult.data) {
      setConfig(configResult.data);
      setCurrency(configResult.data.currency);
      setFreeThreshold(configResult.data.free_shipping_threshold);
    }

    if (providersResult.data) {
      setProviders(providersResult.data);
    }

    setLoading(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        currency: currency,
        free_shipping_threshold: freeThreshold || null,
        base_fee: 0,
        box_fee: 0
      };

      if (config) {
        const { error } = await supabase
          .from('shipping_config')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('shipping_config').insert(configData);
        if (error) throw error;
      }

      toast.success('Beállítások mentve!');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProvider(null);
    setProviderForm({
      name: '',
      provider_type: 'HOME',
      fee: 0,
      is_active: true,
      sort_order: providers.length
    });
    setDialogOpen(true);
  };

  const openEditDialog = (provider: ShippingProvider) => {
    setEditingProvider(provider);
    setProviderForm({
      name: provider.name,
      provider_type: provider.provider_type,
      fee: provider.fee,
      is_active: provider.is_active,
      sort_order: provider.sort_order
    });
    setDialogOpen(true);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.name) {
      toast.error('Név megadása kötelező');
      return;
    }

    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('shipping_providers')
          .update(providerForm)
          .eq('id', editingProvider.id);
        if (error) throw error;
        toast.success('Szolgáltató frissítve');
      } else {
        const { error } = await supabase.from('shipping_providers').insert(providerForm);
        if (error) throw error;
        toast.success('Szolgáltató létrehozva');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a szolgáltatót?')) return;

    const { error } = await supabase.from('shipping_providers').delete().eq('id', id);
    if (error) {
      toast.error('Hiba a törléskor');
    } else {
      toast.success('Szolgáltató törölve');
      fetchData();
    }
  };

  const handleToggleActive = async (provider: ShippingProvider) => {
    const { error } = await supabase
      .from('shipping_providers')
      .update({ is_active: !provider.is_active })
      .eq('id', provider.id);

    if (error) {
      toast.error('Hiba a státusz módosításakor');
    } else {
      fetchData();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const homeProviders = providers.filter(p => p.provider_type === 'HOME');
  const boxProviders = providers.filter(p => p.provider_type === 'BOX');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Szállítási díjak</h1>
          <p className="text-gray-400">Szállítási szolgáltatók és díjak kezelése</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Új szolgáltató
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProvider ? 'Szolgáltató szerkesztése' : 'Új szolgáltató'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-300">Név *</Label>
                <Input
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="pl. Magyar Posta"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Típus</Label>
                <Select
                  value={providerForm.provider_type}
                  onValueChange={(value) => setProviderForm({ ...providerForm, provider_type: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="HOME">Házhozszállítás</SelectItem>
                    <SelectItem value="BOX">Csomagpont</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Díj ({currency})</Label>
                <Input
                  type="number"
                  value={providerForm.fee}
                  onChange={(e) => setProviderForm({ ...providerForm, fee: Number(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Sorrend</Label>
                <Input
                  type="number"
                  value={providerForm.sort_order}
                  onChange={(e) => setProviderForm({ ...providerForm, sort_order: Number(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white w-24"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={providerForm.is_active}
                  onCheckedChange={(checked) => setProviderForm({ ...providerForm, is_active: checked })}
                />
                <Label className="text-gray-300">Aktív</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Mégse</Button>
              <Button onClick={handleSaveProvider}>Mentés</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Home Delivery Providers */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Házhozszállítás</CardTitle>
              <CardDescription className="text-gray-400">
                Futárszolgálatok házhozszállításhoz
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {homeProviders.length === 0 ? (
              <p className="text-gray-500 text-sm">Még nincsenek házhozszállítási szolgáltatók</p>
            ) : (
              homeProviders.map((provider) => (
                <div 
                  key={provider.id} 
                  className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg ${!provider.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span className="text-white">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-medium">{formatPrice(provider.fee)}</span>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={() => handleToggleActive(provider)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(provider)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProvider(provider.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Box/Parcel Locker Providers */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Csomagpontok</CardTitle>
              <CardDescription className="text-gray-400">
                Csomagautomaták és átvételi pontok
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {boxProviders.length === 0 ? (
              <p className="text-gray-500 text-sm">Még nincsenek csomagpont szolgáltatók</p>
            ) : (
              boxProviders.map((provider) => (
                <div 
                  key={provider.id} 
                  className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg ${!provider.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-medium">{formatPrice(provider.fee)}</span>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={() => handleToggleActive(provider)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(provider)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProvider(provider.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Free Shipping Threshold */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Gift className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Ingyenes szállítás</CardTitle>
              <CardDescription className="text-gray-400">
                Rendelési összeg, ami felett ingyenes a szállítás
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-gray-300">Küszöbérték ({currency})</Label>
            <Input
              type="number"
              value={freeThreshold || ''}
              onChange={(e) => setFreeThreshold(e.target.value ? Number(e.target.value) : null)}
              placeholder="Nincs küszöb"
              className="bg-gray-800 border-gray-700 text-white max-w-sm"
            />
            {freeThreshold && (
              <p className="text-sm text-gray-400">
                {formatPrice(freeThreshold)} felett ingyenes a szállítás
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveConfig} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Mentés...' : 'Beállítások mentése'}
        </Button>
      </div>
    </div>
  );
}