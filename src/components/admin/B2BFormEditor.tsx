import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

interface B2BFormConfig {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  form_title: string;
  company_label: string;
  name_label: string;
  email_label: string;
  phone_label: string;
  headcount_label: string;
  message_label: string;
  gdpr_label: string;
  submit_button: string;
  benefits: string[];
}

const defaultConfig: Record<string, B2BFormConfig> = {
  hu: {
    title: "Céges egészségprogram – min. 8 főtől",
    subtitle: "",
    description: "Hozzuk formába a csapatot – kérj visszahívást, és kitaláljuk a nektek működő megoldást.",
    button_text: "Ajánlatot kérek",
    form_title: "Kérj visszahívást!",
    company_label: "Cégnév",
    name_label: "Kapcsolattartó neve",
    email_label: "Email cím",
    phone_label: "Telefonszám",
    headcount_label: "Várható létszám",
    message_label: "Megjegyzés",
    gdpr_label: "Elfogadom az adatkezelési tájékoztatót",
    submit_button: "Visszahívást kérek",
    benefits: [
      "8+ fős csapatoknak",
      "Egyedi edzéstervek",
      "Rugalmas helyszínek",
      "Havi riportok"
    ]
  },
  en: {
    title: "Corporate wellness program – min. 8 people",
    subtitle: "",
    description: "Let's get your team in shape – request a callback and we'll figure out the solution that works for you.",
    button_text: "Request a quote",
    form_title: "Request a callback!",
    company_label: "Company name",
    name_label: "Contact person",
    email_label: "Email",
    phone_label: "Phone",
    headcount_label: "Expected headcount",
    message_label: "Notes",
    gdpr_label: "I accept the privacy policy",
    submit_button: "Request callback",
    benefits: [
      "For teams of 8+",
      "Custom training plans",
      "Flexible locations",
      "Monthly reports"
    ]
  },
  es: {
    title: "Programa de bienestar corporativo – min. 8 personas",
    subtitle: "",
    description: "Pongamos a tu equipo en forma – solicita una llamada y encontraremos la solución que funcione para ti.",
    button_text: "Solicitar cotización",
    form_title: "¡Solicita una llamada!",
    company_label: "Nombre de la empresa",
    name_label: "Persona de contacto",
    email_label: "Correo electrónico",
    phone_label: "Teléfono",
    headcount_label: "Número esperado",
    message_label: "Notas",
    gdpr_label: "Acepto la política de privacidad",
    submit_button: "Solicitar llamada",
    benefits: [
      "Para equipos de 8+",
      "Planes de entrenamiento personalizados",
      "Ubicaciones flexibles",
      "Informes mensuales"
    ]
  }
};

export function B2BFormEditor() {
  const [config, setConfig] = useState<Record<string, B2BFormConfig>>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from("landing_page_sections")
      .select("*")
      .eq("section_key", "b2b")
      .maybeSingle();

    if (!error && data) {
      const newConfig = { ...defaultConfig };
      
      (['hu', 'en', 'es'] as const).forEach(lang => {
        const contentField = `content_${lang}` as keyof typeof data;
        const titleField = `title_${lang}` as keyof typeof data;
        const subtitleField = `subtitle_${lang}` as keyof typeof data;
        
        try {
          const rawContent = data[contentField] as string;
          if (rawContent) {
            const parsed = JSON.parse(rawContent);
            newConfig[lang] = {
              ...defaultConfig[lang],
              ...parsed,
              title: (data[titleField] as string) || defaultConfig[lang].title,
              subtitle: (data[subtitleField] as string) || defaultConfig[lang].subtitle,
            };
          }
        } catch {
          // Keep defaults
        }
      });
      
      setConfig(newConfig);
    }
    setLoading(false);
  };

  const updateConfig = (lang: string, field: keyof B2BFormConfig, value: string | string[]) => {
    setConfig(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  const addBenefit = (lang: string) => {
    const newBenefits = [...config[lang].benefits, ''];
    updateConfig(lang, 'benefits', newBenefits);
  };

  const removeBenefit = (lang: string, index: number) => {
    const newBenefits = config[lang].benefits.filter((_, i) => i !== index);
    updateConfig(lang, 'benefits', newBenefits);
  };

  const updateBenefit = (lang: string, index: number, value: string) => {
    const newBenefits = [...config[lang].benefits];
    newBenefits[index] = value;
    updateConfig(lang, 'benefits', newBenefits);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("landing_page_sections")
      .update({
        title_hu: config.hu.title,
        title_en: config.en.title,
        title_es: config.es.title,
        subtitle_hu: config.hu.subtitle,
        subtitle_en: config.en.subtitle,
        subtitle_es: config.es.subtitle,
        content_hu: JSON.stringify({
          description: config.hu.description,
          button: config.hu.button_text,
          form_title: config.hu.form_title,
          company_label: config.hu.company_label,
          name_label: config.hu.name_label,
          email_label: config.hu.email_label,
          phone_label: config.hu.phone_label,
          headcount_label: config.hu.headcount_label,
          message_label: config.hu.message_label,
          gdpr_label: config.hu.gdpr_label,
          submit_button: config.hu.submit_button,
          benefits: config.hu.benefits,
        }),
        content_en: JSON.stringify({
          description: config.en.description,
          button: config.en.button_text,
          form_title: config.en.form_title,
          company_label: config.en.company_label,
          name_label: config.en.name_label,
          email_label: config.en.email_label,
          phone_label: config.en.phone_label,
          headcount_label: config.en.headcount_label,
          message_label: config.en.message_label,
          gdpr_label: config.en.gdpr_label,
          submit_button: config.en.submit_button,
          benefits: config.en.benefits,
        }),
        content_es: JSON.stringify({
          description: config.es.description,
          button: config.es.button_text,
          form_title: config.es.form_title,
          company_label: config.es.company_label,
          name_label: config.es.name_label,
          email_label: config.es.email_label,
          phone_label: config.es.phone_label,
          headcount_label: config.es.headcount_label,
          message_label: config.es.message_label,
          gdpr_label: config.es.gdpr_label,
          submit_button: config.es.submit_button,
          benefits: config.es.benefits,
        }),
      })
      .eq("section_key", "b2b");

    if (error) {
      toast.error("Hiba a mentéskor");
      console.error(error);
    } else {
      toast.success("B2B szekció mentve");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>

      <Tabs defaultValue="hu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="hu">Magyar</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="es">Español</TabsTrigger>
        </TabsList>

        {(['hu', 'en', 'es'] as const).map((lang) => (
          <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
            {/* Main section content */}
            <Card className="p-4 bg-muted/30 border-border">
              <h4 className="font-medium text-foreground mb-3">Főoldal szekció</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Cím</Label>
                  <Input
                    value={config[lang].title}
                    onChange={(e) => updateConfig(lang, 'title', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Leírás</Label>
                  <Textarea
                    value={config[lang].description}
                    onChange={(e) => updateConfig(lang, 'description', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Gomb szöveg</Label>
                  <Input
                    value={config[lang].button_text}
                    onChange={(e) => updateConfig(lang, 'button_text', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Form labels */}
            <Card className="p-4 bg-muted/30 border-border">
              <h4 className="font-medium text-foreground mb-3">Űrlap mezők (B2B oldal)</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Űrlap cím</Label>
                  <Input
                    value={config[lang].form_title}
                    onChange={(e) => updateConfig(lang, 'form_title', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Cégnév címke</Label>
                  <Input
                    value={config[lang].company_label}
                    onChange={(e) => updateConfig(lang, 'company_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Név címke</Label>
                  <Input
                    value={config[lang].name_label}
                    onChange={(e) => updateConfig(lang, 'name_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Email címke</Label>
                  <Input
                    value={config[lang].email_label}
                    onChange={(e) => updateConfig(lang, 'email_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Telefon címke</Label>
                  <Input
                    value={config[lang].phone_label}
                    onChange={(e) => updateConfig(lang, 'phone_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Létszám címke</Label>
                  <Input
                    value={config[lang].headcount_label}
                    onChange={(e) => updateConfig(lang, 'headcount_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Megjegyzés címke</Label>
                  <Input
                    value={config[lang].message_label}
                    onChange={(e) => updateConfig(lang, 'message_label', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Küldés gomb</Label>
                  <Input
                    value={config[lang].submit_button}
                    onChange={(e) => updateConfig(lang, 'submit_button', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-muted-foreground">GDPR checkbox</Label>
                <Input
                  value={config[lang].gdpr_label}
                  onChange={(e) => updateConfig(lang, 'gdpr_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
            </Card>

            {/* Benefits */}
            <Card className="p-4 bg-muted/30 border-border">
              <Label className="text-muted-foreground mb-3 block">Előnyök lista</Label>
              <div className="space-y-2">
                {config[lang].benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(lang, index, e.target.value)}
                      className="bg-muted border-border text-foreground flex-1"
                      placeholder={`Előny ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBenefit(lang, index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBenefit(lang)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Előny hozzáadása
                </Button>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
