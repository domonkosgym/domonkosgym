import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Gift, Save } from "lucide-react";

interface ShippingConfig {
  id: string;
  base_fee: number;
  box_fee: number;
  currency: string;
  free_shipping_threshold: number | null;
}

export default function ShippingAdmin() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [baseFee, setBaseFee] = useState(0);
  const [boxFee, setBoxFee] = useState(0);
  const [currency, setCurrency] = useState('HUF');
  const [freeThreshold, setFreeThreshold] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('shipping_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setConfig(data);
      setBaseFee(data.base_fee);
      setBoxFee(data.box_fee || 0);
      setCurrency(data.currency);
      setFreeThreshold(data.free_shipping_threshold);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configData = {
        base_fee: baseFee,
        box_fee: boxFee,
        currency: currency,
        free_shipping_threshold: freeThreshold || null,
      };

      if (config) {
        const { error } = await supabase
          .from('shipping_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_config')
          .insert(configData);

        if (error) throw error;
      }

      toast.success('Szállítási beállítások mentve!');
      fetchConfig();
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Szállítási díjak</h1>
        <p className="text-gray-400">Fizikai termékek szállítási költségeinek beállítása</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Base Shipping Fee */}
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Házhozszállítás</CardTitle>
                <CardDescription className="text-gray-400">
                  Alap szállítási díj házhozszállítás esetén
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-gray-300">Díj ({currency})</Label>
              <Input
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Box/Parcel Locker Fee */}
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Csomagpont</CardTitle>
                <CardDescription className="text-gray-400">
                  Szállítási díj csomagautomatába szállítás esetén
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-gray-300">Díj ({currency})</Label>
              <Input
                type="number"
                value={boxFee}
                onChange={(e) => setBoxFee(Number(e.target.value))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Free Shipping Threshold */}
        <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Ingyenes szállítás</CardTitle>
                <CardDescription className="text-gray-400">
                  Rendelési összeg, ami felett ingyenes a szállítás (hagyja üresen, ha nincs ilyen)
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
      </div>

      {/* Preview */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardHeader>
          <CardTitle className="text-white">Előnézet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Házhozszállítás</span>
              </div>
              <span className="text-white font-medium">{formatPrice(baseFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Csomagpontra szállítás</span>
              </div>
              <span className="text-white font-medium">{formatPrice(boxFee)}</span>
            </div>
            {freeThreshold && (
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Ingyenes szállítás</span>
                </div>
                <span className="text-green-400 font-medium">{formatPrice(freeThreshold)} felett</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Mentés...' : 'Beállítások mentése'}
        </Button>
      </div>
    </div>
  );
}