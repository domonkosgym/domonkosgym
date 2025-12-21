import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SzamlazzSettings {
  id?: string;
  agent_key: string;
  username: string;
  password: string;
  invoice_prefix: string;
  payment_method: string;
  currency: string;
  language: string;
  enabled: boolean;
}

export default function SzamlazzSettings() {
  const [settings, setSettings] = useState<SzamlazzSettings>({
    agent_key: "",
    username: "",
    password: "",
    invoice_prefix: "INV",
    payment_method: "cash",
    currency: "HUF",
    language: "hu",
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("szamlazz_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Hiba történt a beállítások betöltése közben");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from("szamlazz_settings")
          .update({
            agent_key: settings.agent_key,
            username: settings.username,
            password: settings.password,
            invoice_prefix: settings.invoice_prefix,
            payment_method: settings.payment_method,
            currency: settings.currency,
            language: settings.language,
            enabled: settings.enabled,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("szamlazz_settings")
          .insert({
            agent_key: settings.agent_key,
            username: settings.username,
            password: settings.password,
            invoice_prefix: settings.invoice_prefix,
            payment_method: settings.payment_method,
            currency: settings.currency,
            language: settings.language,
            enabled: settings.enabled,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

      toast.success("Beállítások sikeresen mentve");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Hiba történt a mentés során");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Számlázz.hu Integráció</h1>
        <p className="text-muted-foreground mt-2">
          Konfiguráld a számlázz.hu API kapcsolatot az automatikus számlakiállításhoz
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Beállítások</CardTitle>
          <CardDescription>
            Add meg a számlázz.hu fiókod API hozzáférési adatait
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Integráció engedélyezése</Label>
              <p className="text-sm text-muted-foreground">
                Kapcsold be az automatikus számlakiállítást
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent_key">Agent Kulcs *</Label>
              <Input
                id="agent_key"
                type="password"
                placeholder="Számlázz.hu agent kulcs"
                value={settings.agent_key}
                onChange={(e) =>
                  setSettings({ ...settings, agent_key: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                A számlázz.hu fiókodban található API kulcs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Felhasználónév *</Label>
              <Input
                id="username"
                placeholder="email@example.com"
                value={settings.username}
                onChange={(e) =>
                  setSettings({ ...settings, username: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Jelszó *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={settings.password}
                onChange={(e) =>
                  setSettings({ ...settings, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Számla beállítások</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Számla előtag</Label>
                <Input
                  id="invoice_prefix"
                  placeholder="INV"
                  value={settings.invoice_prefix}
                  onChange={(e) =>
                    setSettings({ ...settings, invoice_prefix: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Fizetési mód</Label>
                <Select
                  value={settings.payment_method}
                  onValueChange={(value) =>
                    setSettings({ ...settings, payment_method: value })
                  }
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Készpénz</SelectItem>
                    <SelectItem value="transfer">Átutalás</SelectItem>
                    <SelectItem value="card">Kártya</SelectItem>
                    <SelectItem value="check">Csekk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Pénznem</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, currency: value })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HUF">HUF (Forint)</SelectItem>
                    <SelectItem value="EUR">EUR (Euró)</SelectItem>
                    <SelectItem value="USD">USD (Dollár)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Nyelv</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, language: value })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hu">Magyar</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mentés
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
