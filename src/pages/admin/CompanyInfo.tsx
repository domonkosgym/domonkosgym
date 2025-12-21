import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface CompanyInfo {
  id?: string;
  company_name: string;
  tax_number: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  bank_name: string;
  bank_account: string;
  contact_email: string;
  contact_phone: string;
}

export default function CompanyInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<CompanyInfo>({
    company_name: "",
    tax_number: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Magyarország",
    bank_name: "",
    bank_account: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    const { data } = await supabase
      .from("company_billing_info")
      .select("*")
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setInfo(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (info.id) {
        const { error } = await supabase
          .from("company_billing_info")
          .update(info)
          .eq("id", info.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_billing_info")
          .insert(info);
        
        if (error) throw error;
      }
      
      toast.success("Céges adatok mentve");
      loadInfo();
    } catch (error) {
      console.error(error);
      toast.error("Hiba történt a mentés során");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Céges számlázási adatok</h1>
        <p className="text-muted-foreground">
          Add meg a cég adatait, amelyek megjelennek a számlákon
        </p>
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Cégnév *</label>
            <Input
              value={info.company_name}
              onChange={(e) => setInfo({ ...info, company_name: e.target.value })}
              className="mt-1"
              placeholder="Pl. Domonkos Gym Kft."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Adószám *</label>
            <Input
              value={info.tax_number}
              onChange={(e) => setInfo({ ...info, tax_number: e.target.value })}
              className="mt-1"
              placeholder="12345678-1-23"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Cím *</label>
            <Input
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              className="mt-1"
              placeholder="Pl. Fő utca 123."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Város *</label>
            <Input
              value={info.city}
              onChange={(e) => setInfo({ ...info, city: e.target.value })}
              className="mt-1"
              placeholder="Budapest"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Irányítószám *</label>
            <Input
              value={info.postal_code}
              onChange={(e) => setInfo({ ...info, postal_code: e.target.value })}
              className="mt-1"
              placeholder="1234"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Ország *</label>
            <Input
              value={info.country}
              onChange={(e) => setInfo({ ...info, country: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Kapcsolattartó email *</label>
            <Input
              type="email"
              value={info.contact_email}
              onChange={(e) => setInfo({ ...info, contact_email: e.target.value })}
              className="mt-1"
              placeholder="info@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Kapcsolattartó telefon</label>
            <Input
              value={info.contact_phone}
              onChange={(e) => setInfo({ ...info, contact_phone: e.target.value })}
              className="mt-1"
              placeholder="+36 1 234 5678"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Bank neve</label>
            <Input
              value={info.bank_name}
              onChange={(e) => setInfo({ ...info, bank_name: e.target.value })}
              className="mt-1"
              placeholder="Pl. OTP Bank"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Bankszámlaszám</label>
            <Input
              value={info.bank_account}
              onChange={(e) => setInfo({ ...info, bank_account: e.target.value })}
              className="mt-1"
              placeholder="12345678-12345678-12345678"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Mentés..." : "Mentés"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
