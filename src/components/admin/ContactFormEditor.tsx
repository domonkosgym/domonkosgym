import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

interface ContactFormConfig {
  title: string;
  subtitle: string;
  interest_options: string[];
  name_label: string;
  email_label: string;
  phone_label: string;
  interest_label: string;
  message_label: string;
  gdpr_label: string;
  marketing_label: string;
  submit_button: string;
}

const defaultConfig: Record<string, ContactFormConfig> = {
  hu: {
    title: "Kapcsolat",
    subtitle: "Töltsd ki az űrlapot, és hamarosan keresünk.",
    interest_options: ["Konzultáció", "Étrend", "Edzésterv", "Arany csomag", "Platina csomag", "Anti-Aging"],
    name_label: "Név",
    email_label: "Email",
    phone_label: "Telefon",
    interest_label: "Érdeklődési terület",
    message_label: "Üzenet",
    gdpr_label: "Elfogadom az adatkezelési tájékoztatót",
    marketing_label: "Szeretnék hírlevelet kapni újdonságokról",
    submit_button: "Küldés"
  },
  en: {
    title: "Contact",
    subtitle: "Fill out the form and we'll get back to you soon.",
    interest_options: ["Consultation", "Diet", "Training Plan", "Gold Package", "Platinum Package", "Anti-Aging"],
    name_label: "Name",
    email_label: "Email",
    phone_label: "Phone",
    interest_label: "Area of interest",
    message_label: "Message",
    gdpr_label: "I accept the privacy policy",
    marketing_label: "I want to receive newsletter about news",
    submit_button: "Submit"
  },
  es: {
    title: "Contacto",
    subtitle: "Completa el formulario y te responderemos pronto.",
    interest_options: ["Consulta", "Dieta", "Plan de entrenamiento", "Paquete Oro", "Paquete Platino", "Anti-Aging"],
    name_label: "Nombre",
    email_label: "Correo",
    phone_label: "Teléfono",
    interest_label: "Área de interés",
    message_label: "Mensaje",
    gdpr_label: "Acepto la política de privacidad",
    marketing_label: "Quiero recibir boletín informativo",
    submit_button: "Enviar"
  }
};

export function ContactFormEditor() {
  const [config, setConfig] = useState<Record<string, ContactFormConfig>>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from("landing_page_sections")
      .select("*")
      .eq("section_key", "contact")
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

  const updateConfig = (lang: string, field: keyof ContactFormConfig, value: string | string[]) => {
    setConfig(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  const addInterestOption = (lang: string) => {
    const newOptions = [...config[lang].interest_options, ''];
    updateConfig(lang, 'interest_options', newOptions);
  };

  const removeInterestOption = (lang: string, index: number) => {
    const newOptions = config[lang].interest_options.filter((_, i) => i !== index);
    updateConfig(lang, 'interest_options', newOptions);
  };

  const updateInterestOption = (lang: string, index: number, value: string) => {
    const newOptions = [...config[lang].interest_options];
    newOptions[index] = value;
    updateConfig(lang, 'interest_options', newOptions);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("landing_page_sections")
      .upsert({
        section_key: "contact",
        title_hu: config.hu.title,
        title_en: config.en.title,
        title_es: config.es.title,
        subtitle_hu: config.hu.subtitle,
        subtitle_en: config.en.subtitle,
        subtitle_es: config.es.subtitle,
        content_hu: JSON.stringify({
          interest_options: config.hu.interest_options,
          name_label: config.hu.name_label,
          email_label: config.hu.email_label,
          phone_label: config.hu.phone_label,
          interest_label: config.hu.interest_label,
          message_label: config.hu.message_label,
          gdpr_label: config.hu.gdpr_label,
          marketing_label: config.hu.marketing_label,
          submit_button: config.hu.submit_button,
        }),
        content_en: JSON.stringify({
          interest_options: config.en.interest_options,
          name_label: config.en.name_label,
          email_label: config.en.email_label,
          phone_label: config.en.phone_label,
          interest_label: config.en.interest_label,
          message_label: config.en.message_label,
          gdpr_label: config.en.gdpr_label,
          marketing_label: config.en.marketing_label,
          submit_button: config.en.submit_button,
        }),
        content_es: JSON.stringify({
          interest_options: config.es.interest_options,
          name_label: config.es.name_label,
          email_label: config.es.email_label,
          phone_label: config.es.phone_label,
          interest_label: config.es.interest_label,
          message_label: config.es.message_label,
          gdpr_label: config.es.gdpr_label,
          marketing_label: config.es.marketing_label,
          submit_button: config.es.submit_button,
        }),
        is_active: true,
      }, { onConflict: 'section_key' });

    if (error) {
      toast.error("Hiba a mentéskor");
      console.error(error);
    } else {
      toast.success("Kapcsolat űrlap mentve");
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Cím</Label>
                <Input
                  value={config[lang].title}
                  onChange={(e) => updateConfig(lang, 'title', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Alcím</Label>
                <Input
                  value={config[lang].subtitle}
                  onChange={(e) => updateConfig(lang, 'subtitle', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
            </div>

            <Card className="p-4 bg-muted/30 border-border">
              <Label className="text-muted-foreground mb-3 block">Érdeklődési területek</Label>
              <div className="space-y-2">
                {config[lang].interest_options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateInterestOption(lang, index, e.target.value)}
                      className="bg-muted border-border text-foreground flex-1"
                      placeholder={`Opció ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInterestOption(lang, index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addInterestOption(lang)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Opció hozzáadása
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Név mező címke</Label>
                <Input
                  value={config[lang].name_label}
                  onChange={(e) => updateConfig(lang, 'name_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Email mező címke</Label>
                <Input
                  value={config[lang].email_label}
                  onChange={(e) => updateConfig(lang, 'email_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Telefon mező címke</Label>
                <Input
                  value={config[lang].phone_label}
                  onChange={(e) => updateConfig(lang, 'phone_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Érdeklődési terület címke</Label>
                <Input
                  value={config[lang].interest_label}
                  onChange={(e) => updateConfig(lang, 'interest_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Üzenet mező címke</Label>
                <Input
                  value={config[lang].message_label}
                  onChange={(e) => updateConfig(lang, 'message_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Küldés gomb szöveg</Label>
                <Input
                  value={config[lang].submit_button}
                  onChange={(e) => updateConfig(lang, 'submit_button', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">GDPR checkbox szöveg</Label>
                <Input
                  value={config[lang].gdpr_label}
                  onChange={(e) => updateConfig(lang, 'gdpr_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Marketing checkbox szöveg</Label>
                <Input
                  value={config[lang].marketing_label}
                  onChange={(e) => updateConfig(lang, 'marketing_label', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
