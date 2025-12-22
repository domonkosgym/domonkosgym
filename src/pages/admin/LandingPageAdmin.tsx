import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, X, Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { ProcessStepsEditor } from "@/components/admin/ProcessStepsEditor";
import { FAQEditor } from "@/components/admin/FAQEditor";
import { ContactFormEditor } from "@/components/admin/ContactFormEditor";
import { B2BFormEditor } from "@/components/admin/B2BFormEditor";

interface LandingSection {
  id: string;
  section_key: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  subtitle_hu: string | null;
  subtitle_en: string | null;
  subtitle_es: string | null;
  content_hu: string;
  content_en: string;
  content_es: string;
  image_urls: string[];
  sort_order: number;
  is_active: boolean;
}

interface HeroContent {
  intro: string;
  slogan: string;
  slogan2: string;
  features: string[];
  cta_button: string;
  join_title: string;
  join_subtitle: string;
}

interface BioContent {
  text1: string;
  text2: string;
}

interface SloganContent {
  text: string;
}

interface B2BContent {
  description: string;
  button: string;
}

export default function LandingPageAdmin() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data, error } = await supabase
      .from("landing_page_sections")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error(error);
      toast.error("Hiba az adatok betöltésekor");
    } else if (data) {
      setSections(data);
      if (data.length > 0 && !activeSectionId) {
        setActiveSectionId(data[0].id);
      }
    }
    setLoading(false);
  };

  const updateSection = (id: string, updates: Partial<LandingSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    const updatedSections = newSections.map((section, idx) => ({
      ...section,
      sort_order: idx + 1,
    }));
    
    setSections(updatedSections);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFor(sectionId);
    
    const section = sections.find(s => s.id === sectionId);
    const isHeroOrProcess = section && (section.section_key === 'hero' || section.section_key === 'process');
    
    // Delete old images from storage if replacing (only for hero/process which have 1 image)
    if (isHeroOrProcess && section?.image_urls && section.image_urls.length > 0) {
      for (const oldUrl of section.image_urls) {
        try {
          // Extract path from URL
          const urlParts = oldUrl.split('/book-covers/');
          if (urlParts.length > 1) {
            const oldPath = urlParts[1];
            await supabase.storage.from('book-covers').remove([oldPath]);
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `landing-${sectionId}-${Date.now()}.${fileExt}`;
    const filePath = `landing/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Hiba a kép feltöltésekor');
      console.error(uploadError);
      setUploadingFor(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath);

    if (section) {
      // For hero and process: replace single image; for others: add to array
      const newImages = isHeroOrProcess ? [publicUrl] : [...(section.image_urls || []), publicUrl];
      updateSection(sectionId, { image_urls: newImages });
    }
    
    setUploadingFor(null);
    toast.success('Kép feltöltve');
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeImage = async (sectionId: string, imageIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const imageUrl = section.image_urls[imageIndex];
      
      // Delete from storage
      try {
        const urlParts = imageUrl.split('/book-covers/');
        if (urlParts.length > 1) {
          const oldPath = urlParts[1];
          await supabase.storage.from('book-covers').remove([oldPath]);
        }
      } catch (err) {
        console.error('Error deleting image from storage:', err);
      }
      
      const newImages = section.image_urls.filter((_, i) => i !== imageIndex);
      updateSection(sectionId, { image_urls: newImages });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    for (const section of sections) {
      const { error } = await supabase
        .from("landing_page_sections")
        .update({
          title_hu: section.title_hu,
          title_en: section.title_en,
          title_es: section.title_es,
          subtitle_hu: section.subtitle_hu,
          subtitle_en: section.subtitle_en,
          subtitle_es: section.subtitle_es,
          content_hu: section.content_hu,
          content_en: section.content_en,
          content_es: section.content_es,
          image_urls: section.image_urls,
          is_active: section.is_active,
          sort_order: section.sort_order,
        })
        .eq("id", section.id);

      if (error) {
        toast.error(`Hiba a mentéskor: ${section.title_hu}`);
        console.error(error);
        setSaving(false);
        return;
      }
    }

    toast.success("Főoldal mentve");
    setSaving(false);
  };

  const getSectionDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      hero: "A főoldal tetején megjelenő nagy banner kép és szöveg",
      books: "Könyvek és termékek szekció",
      train_hard: "Motivációs szlogen szekció",
      featured_in: "Média megjelenések és linkek",
      bio: "Bemutatkozás szekció",
      process: "Hogyan működik lépések",
      b2b: "Vállalati ajánlatok szekció",
      faq: "Gyakran ismételt kérdések",
      contact: "Kapcsolatfelvételi űrlap",
    };
    return descriptions[key] || "";
  };

  // Parse JSON content safely
  const parseJsonContent = <T,>(content: string, defaultValue: T): T => {
    if (!content) return defaultValue;
    try {
      return JSON.parse(content);
    } catch {
      return defaultValue;
    }
  };

  // Update JSON content field
  const updateJsonContent = (sectionId: string, lang: 'hu' | 'en' | 'es', field: string, value: any) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const contentKey = `content_${lang}` as keyof LandingSection;
    const currentContent = parseJsonContent(section[contentKey] as string, {});
    const newContent = { ...currentContent, [field]: value };
    
    updateSection(sectionId, { [contentKey]: JSON.stringify(newContent) });
  };

  // Add feature to list
  const addFeature = (sectionId: string, lang: 'hu' | 'en' | 'es') => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const contentKey = `content_${lang}` as keyof LandingSection;
    const content = parseJsonContent<HeroContent>(section[contentKey] as string, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });
    const newFeatures = [...(content.features || []), ''];
    updateJsonContent(sectionId, lang, 'features', newFeatures);
  };

  // Remove feature from list
  const removeFeature = (sectionId: string, lang: 'hu' | 'en' | 'es', index: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const contentKey = `content_${lang}` as keyof LandingSection;
    const content = parseJsonContent<HeroContent>(section[contentKey] as string, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });
    const newFeatures = content.features.filter((_, i) => i !== index);
    updateJsonContent(sectionId, lang, 'features', newFeatures);
  };

  // Update feature in list
  const updateFeature = (sectionId: string, lang: 'hu' | 'en' | 'es', index: number, value: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const contentKey = `content_${lang}` as keyof LandingSection;
    const content = parseJsonContent<HeroContent>(section[contentKey] as string, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });
    const newFeatures = [...content.features];
    newFeatures[index] = value;
    updateJsonContent(sectionId, lang, 'features', newFeatures);
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  const renderHeroEditor = (section: LandingSection) => {
    const contentHu = parseJsonContent<HeroContent>(section.content_hu, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });
    const contentEn = parseJsonContent<HeroContent>(section.content_en, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });
    const contentEs = parseJsonContent<HeroContent>(section.content_es, { 
      intro: '', slogan: '', slogan2: '', features: [], cta_button: '', join_title: '', join_subtitle: '' 
    });

    return (
      <Tabs defaultValue="hu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="hu">Magyar</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="es">Español</TabsTrigger>
        </TabsList>

        {(['hu', 'en', 'es'] as const).map((lang) => {
          const content = lang === 'hu' ? contentHu : lang === 'en' ? contentEn : contentEs;
          const labels = {
            hu: { title: 'Főcím', subtitle: 'Alcím', intro: 'Bevezető szöveg', slogan: 'Szlogen', slogan2: 'Második szlogen', features: 'Feature lista', cta: 'CTA gomb szöveg', joinTitle: 'Csatlakozz cím', joinSubtitle: 'Csatlakozz alcím' },
            en: { title: 'Title', subtitle: 'Subtitle', intro: 'Intro text', slogan: 'Slogan', slogan2: 'Second slogan', features: 'Feature list', cta: 'CTA button text', joinTitle: 'Join title', joinSubtitle: 'Join subtitle' },
            es: { title: 'Título', subtitle: 'Subtítulo', intro: 'Texto introductorio', slogan: 'Eslogan', slogan2: 'Segundo eslogan', features: 'Lista de características', cta: 'Texto del botón CTA', joinTitle: 'Título únete', joinSubtitle: 'Subtítulo únete' }
          };
          const l = labels[lang];

          return (
            <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{l.title}</Label>
                  <Input
                    value={section[`title_${lang}` as keyof LandingSection] as string}
                    onChange={(e) => updateSection(section.id, { [`title_${lang}`]: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{l.subtitle}</Label>
                  <Input
                    value={section[`subtitle_${lang}` as keyof LandingSection] as string || ''}
                    onChange={(e) => updateSection(section.id, { [`subtitle_${lang}`]: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">{l.intro}</Label>
                <Textarea
                  value={content.intro || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'intro', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{l.slogan}</Label>
                  <Input
                    value={content.slogan || ''}
                    onChange={(e) => updateJsonContent(section.id, lang, 'slogan', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{l.slogan2}</Label>
                  <Input
                    value={content.slogan2 || ''}
                    onChange={(e) => updateJsonContent(section.id, lang, 'slogan2', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">{l.features}</Label>
                <div className="space-y-2">
                  {(content.features || []).map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(section.id, lang, index, e.target.value)}
                        className="bg-muted border-border text-foreground flex-1"
                        placeholder={`Feature ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(section.id, lang, index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature(section.id, lang)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Feature hozzáadása
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">{l.cta}</Label>
                  <Input
                    value={content.cta_button || ''}
                    onChange={(e) => updateJsonContent(section.id, lang, 'cta_button', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{l.joinTitle}</Label>
                  <Input
                    value={content.join_title || ''}
                    onChange={(e) => updateJsonContent(section.id, lang, 'join_title', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">{l.joinSubtitle}</Label>
                  <Input
                    value={content.join_subtitle || ''}
                    onChange={(e) => updateJsonContent(section.id, lang, 'join_subtitle', e.target.value)}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  const renderBioEditor = (section: LandingSection) => {
    const contentHu = parseJsonContent<BioContent>(section.content_hu, { text1: '', text2: '' });
    const contentEn = parseJsonContent<BioContent>(section.content_en, { text1: '', text2: '' });
    const contentEs = parseJsonContent<BioContent>(section.content_es, { text1: '', text2: '' });

    return (
      <Tabs defaultValue="hu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="hu">Magyar</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="es">Español</TabsTrigger>
        </TabsList>

        {(['hu', 'en', 'es'] as const).map((lang) => {
          const content = lang === 'hu' ? contentHu : lang === 'en' ? contentEn : contentEs;
          
          return (
            <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">Cím</Label>
                <Input
                  value={section[`title_${lang}` as keyof LandingSection] as string}
                  onChange={(e) => updateSection(section.id, { [`title_${lang}`]: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Első bekezdés</Label>
                <Textarea
                  value={content.text1 || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'text1', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                  rows={4}
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Második bekezdés</Label>
                <Textarea
                  value={content.text2 || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'text2', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                  rows={4}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  const renderSloganEditor = (section: LandingSection) => {
    const contentHu = parseJsonContent<SloganContent>(section.content_hu, { text: '' });
    const contentEn = parseJsonContent<SloganContent>(section.content_en, { text: '' });
    const contentEs = parseJsonContent<SloganContent>(section.content_es, { text: '' });

    return (
      <Tabs defaultValue="hu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="hu">Magyar</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="es">Español</TabsTrigger>
        </TabsList>

        {(['hu', 'en', 'es'] as const).map((lang) => {
          const content = lang === 'hu' ? contentHu : lang === 'en' ? contentEn : contentEs;
          
          return (
            <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">Szlogen szöveg</Label>
                <Input
                  value={content.text || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'text', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                  placeholder="pl. EDDZ KEMÉNYEN! ÉLJ JOBBAN!"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tipp: A felkiáltójel után lévő rész más színnel jelenik meg
                </p>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  const renderB2BEditor = (section: LandingSection) => {
    const contentHu = parseJsonContent<B2BContent>(section.content_hu, { description: '', button: '' });
    const contentEn = parseJsonContent<B2BContent>(section.content_en, { description: '', button: '' });
    const contentEs = parseJsonContent<B2BContent>(section.content_es, { description: '', button: '' });

    return (
      <Tabs defaultValue="hu" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="hu">Magyar</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="es">Español</TabsTrigger>
        </TabsList>

        {(['hu', 'en', 'es'] as const).map((lang) => {
          const content = lang === 'hu' ? contentHu : lang === 'en' ? contentEn : contentEs;
          
          return (
            <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">Cím</Label>
                <Input
                  value={section[`title_${lang}` as keyof LandingSection] as string}
                  onChange={(e) => updateSection(section.id, { [`title_${lang}`]: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Leírás</Label>
                <Textarea
                  value={content.description || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'description', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Gomb szöveg</Label>
                <Input
                  value={content.button || ''}
                  onChange={(e) => updateJsonContent(section.id, lang, 'button', e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  const renderDefaultEditor = (section: LandingSection) => (
    <Tabs defaultValue="hu" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted">
        <TabsTrigger value="hu">Magyar</TabsTrigger>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="es">Español</TabsTrigger>
      </TabsList>

      <TabsContent value="hu" className="space-y-4 mt-4">
        <div>
          <Label className="text-muted-foreground">Cím (HU)</Label>
          <Input
            value={section.title_hu}
            onChange={(e) => updateSection(section.id, { title_hu: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Alcím (HU)</Label>
          <Input
            value={section.subtitle_hu || ""}
            onChange={(e) => updateSection(section.id, { subtitle_hu: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            placeholder="Opcionális alcím..."
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Tartalom (HU)</Label>
          <Textarea
            value={section.content_hu}
            onChange={(e) => updateSection(section.id, { content_hu: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            rows={6}
            placeholder="Használj dupla sortörést új bekezdéshez..."
          />
        </div>
      </TabsContent>

      <TabsContent value="en" className="space-y-4 mt-4">
        <div>
          <Label className="text-muted-foreground">Title (EN)</Label>
          <Input
            value={section.title_en}
            onChange={(e) => updateSection(section.id, { title_en: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Subtitle (EN)</Label>
          <Input
            value={section.subtitle_en || ""}
            onChange={(e) => updateSection(section.id, { subtitle_en: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            placeholder="Optional subtitle..."
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Content (EN)</Label>
          <Textarea
            value={section.content_en}
            onChange={(e) => updateSection(section.id, { content_en: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            rows={6}
          />
        </div>
      </TabsContent>

      <TabsContent value="es" className="space-y-4 mt-4">
        <div>
          <Label className="text-muted-foreground">Título (ES)</Label>
          <Input
            value={section.title_es}
            onChange={(e) => updateSection(section.id, { title_es: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Subtítulo (ES)</Label>
          <Input
            value={section.subtitle_es || ""}
            onChange={(e) => updateSection(section.id, { subtitle_es: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            placeholder="Subtítulo opcional..."
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Contenido (ES)</Label>
          <Textarea
            value={section.content_es}
            onChange={(e) => updateSection(section.id, { content_es: e.target.value })}
            className="bg-muted border-border text-foreground mt-1"
            rows={6}
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Főoldal Szekciók</h1>
          <p className="text-muted-foreground mt-1">Szerkeszd a főoldal különböző szekciót</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Mentés..." : "Összes mentése"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sections List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Szekciók</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeSectionId === section.id 
                    ? 'bg-primary/20 border border-primary/50' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => setActiveSectionId(section.id)}
              >
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(index, "up");
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(index, "down");
                    }}
                    disabled={index === sections.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{section.title_hu}</p>
                  <p className="text-muted-foreground text-xs truncate">{getSectionDescription(section.section_key)}</p>
                </div>
                <Switch
                  checked={section.is_active}
                  onCheckedChange={(checked) => updateSection(section.id, { is_active: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section Editor */}
        <Card className="lg:col-span-3 bg-card border-border">
          {activeSection ? (
            <>
              <CardHeader>
                <CardTitle className="text-foreground text-lg">
                  {activeSection.title_hu} szerkesztése
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {getSectionDescription(activeSection.section_key)}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Images - Only show for hero and process sections */}
                {(activeSection.section_key === 'hero' || activeSection.section_key === 'process') && (
                  <div>
                    <Label className="text-muted-foreground mb-3 block">
                      Szekció kép (1 kép)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(activeSection.image_urls || []).slice(0, 1).map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted col-span-2">
                          <img src={url} alt="" className="w-full h-full object-cover object-center" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => removeImage(activeSection.id, index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {(!activeSection.image_urls || activeSection.image_urls.length === 0) && (
                        <div 
                          className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors bg-muted/50 col-span-2"
                          onClick={() => {
                            setUploadingFor(activeSection.id);
                            imageInputRef.current?.click();
                          }}
                        >
                          {uploadingFor === activeSection.id ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          ) : (
                            <>
                              <Plus className="w-8 h-8 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Kép hozzáadása</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadingFor && handleImageUpload(e, uploadingFor)}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Content Editor based on section type */}
                {activeSection.section_key === 'hero' && renderHeroEditor(activeSection)}
                {activeSection.section_key === 'bio' && renderBioEditor(activeSection)}
                {activeSection.section_key === 'process' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A "Hogyan működik?" szekció lépéseinek kezelése. Adj hozzá, szerkeszd vagy töröld a lépéseket.
                    </p>
                    <ProcessStepsEditor />
                  </div>
                )}
                {activeSection.section_key === 'train_hard' && renderSloganEditor(activeSection)}
                {activeSection.section_key === 'b2b' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A B2B szekció és űrlap beállításai (főoldal + B2B oldal).
                    </p>
                    <B2BFormEditor />
                  </div>
                )}
                {activeSection.section_key === 'faq' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Gyakran ismételt kérdések kezelése. Adj hozzá, szerkeszd vagy töröld a kérdéseket.
                    </p>
                    <FAQEditor />
                  </div>
                )}
                {activeSection.section_key === 'contact' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A kapcsolatfelvételi űrlap mezőinek és beállításainak kezelése.
                    </p>
                    <ContactFormEditor />
                  </div>
                )}
                {!['hero', 'bio', 'process', 'train_hard', 'b2b', 'faq', 'contact'].includes(activeSection.section_key) && renderDefaultEditor(activeSection)}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Válassz ki egy szekciót a szerkesztéshez</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
