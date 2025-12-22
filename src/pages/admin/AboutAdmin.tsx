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
import { Save, X, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface AboutSection {
  id: string;
  section_key: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  content_hu: string;
  content_en: string;
  content_es: string;
  image_urls: string[];
  sort_order: number;
  is_active: boolean;
}

export default function AboutAdmin() {
  const [sections, setSections] = useState<AboutSection[]>([]);
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
      .from("about_sections")
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

  const updateSection = (id: string, updates: Partial<AboutSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    // Update sort_order values
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
    
    const fileExt = file.name.split('.').pop();
    const fileName = `about-${sectionId}-${Date.now()}.${fileExt}`;
    const filePath = `about/${fileName}`;

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

    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newImages = [...(section.image_urls || []), publicUrl];
      updateSection(sectionId, { image_urls: newImages });
    }
    
    setUploadingFor(null);
    toast.success('Kép feltöltve');
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeImage = (sectionId: string, imageIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newImages = section.image_urls.filter((_, i) => i !== imageIndex);
      updateSection(sectionId, { image_urls: newImages });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    for (const section of sections) {
      const { error } = await supabase
        .from("about_sections")
        .update({
          title_hu: section.title_hu,
          title_en: section.title_en,
          title_es: section.title_es,
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

    toast.success("Rólam oldal mentve");
    setSaving(false);
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

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
          <h1 className="text-2xl font-bold text-foreground">Rólam Oldal Szekciók</h1>
          <p className="text-muted-foreground mt-1">Szerkeszd a Rólam oldal különböző szekciót</p>
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
                  <p className="text-muted-foreground text-xs">{section.image_urls?.length || 0} kép</p>
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
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Images */}
                <div>
                  <Label className="text-muted-foreground mb-3 block">Képek (max. 4)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(activeSection.image_urls || []).map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
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
                    
                    {(!activeSection.image_urls || activeSection.image_urls.length < 4) && (
                      <div 
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors bg-muted/50"
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

                {/* Content Editor */}
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
                        value={activeSection.title_hu}
                        onChange={(e) => updateSection(activeSection.id, { title_hu: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tartalom (HU)</Label>
                      <Textarea
                        value={activeSection.content_hu}
                        onChange={(e) => updateSection(activeSection.id, { content_hu: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                        rows={8}
                        placeholder="Használj dupla sortörést új bekezdéshez..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="en" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-muted-foreground">Title (EN)</Label>
                      <Input
                        value={activeSection.title_en}
                        onChange={(e) => updateSection(activeSection.id, { title_en: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Content (EN)</Label>
                      <Textarea
                        value={activeSection.content_en}
                        onChange={(e) => updateSection(activeSection.id, { content_en: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                        rows={8}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="es" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-muted-foreground">Título (ES)</Label>
                      <Input
                        value={activeSection.title_es}
                        onChange={(e) => updateSection(activeSection.id, { title_es: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contenido (ES)</Label>
                      <Textarea
                        value={activeSection.content_es}
                        onChange={(e) => updateSection(activeSection.id, { content_es: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                        rows={8}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
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
