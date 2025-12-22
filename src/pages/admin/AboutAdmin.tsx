import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Upload, X, ImageIcon, User } from "lucide-react";

interface AboutPageData {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  subtitle_hu: string | null;
  subtitle_en: string | null;
  subtitle_es: string | null;
  content_hu: string;
  content_en: string;
  content_es: string;
  image_url: string | null;
}

export default function AboutAdmin() {
  const [data, setData] = useState<AboutPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: aboutData, error } = await supabase
      .from("about_page")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      toast.error("Hiba az adatok betöltésekor");
    } else if (aboutData) {
      setData(aboutData);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingImage(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `about-${Date.now()}.${fileExt}`;
    const filePath = `about/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Hiba a kép feltöltésekor');
      console.error(uploadError);
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath);

    setData({ ...data, image_url: publicUrl });
    setUploadingImage(false);
    toast.success('Kép feltöltve');
  };

  const handleRemoveImage = () => {
    if (data) {
      setData({ ...data, image_url: null });
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);

    const { error } = await supabase
      .from("about_page")
      .update({
        title_hu: data.title_hu,
        title_en: data.title_en,
        title_es: data.title_es,
        subtitle_hu: data.subtitle_hu,
        subtitle_en: data.subtitle_en,
        subtitle_es: data.subtitle_es,
        content_hu: data.content_hu,
        content_en: data.content_en,
        content_es: data.content_es,
        image_url: data.image_url,
      })
      .eq("id", data.id);

    if (error) {
      toast.error("Hiba a mentéskor");
      console.error(error);
    } else {
      toast.success("Rólam oldal mentve");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
          <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Nincs Rólam oldal adat</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rólam Oldal</h1>
          <p className="text-gray-400 mt-1">A személyi edző bemutatkozó oldalának szerkesztése</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Mentés..." : "Mentés"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Image */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Profilkép</CardTitle>
          </CardHeader>
          <CardContent>
            {data.image_url ? (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                <img 
                  src={data.image_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
                onClick={() => imageInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                    <span className="text-sm text-gray-400">Kattints a feltöltéshez</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card className="lg:col-span-2 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Tartalom</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hu" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="hu">Magyar</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="es">Español</TabsTrigger>
              </TabsList>

              <TabsContent value="hu" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Cím (HU)</Label>
                  <Input
                    value={data.title_hu}
                    onChange={(e) => setData({ ...data, title_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Alcím (HU)</Label>
                  <Input
                    value={data.subtitle_hu || ''}
                    onChange={(e) => setData({ ...data, subtitle_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="pl. Táplálkozási és teljesítmény-coach"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Bemutatkozás (HU)</Label>
                  <Textarea
                    value={data.content_hu}
                    onChange={(e) => setData({ ...data, content_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={10}
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Title (EN)</Label>
                  <Input
                    value={data.title_en}
                    onChange={(e) => setData({ ...data, title_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtitle (EN)</Label>
                  <Input
                    value={data.subtitle_en || ''}
                    onChange={(e) => setData({ ...data, subtitle_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Content (EN)</Label>
                  <Textarea
                    value={data.content_en}
                    onChange={(e) => setData({ ...data, content_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={10}
                  />
                </div>
              </TabsContent>

              <TabsContent value="es" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Título (ES)</Label>
                  <Input
                    value={data.title_es}
                    onChange={(e) => setData({ ...data, title_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtítulo (ES)</Label>
                  <Input
                    value={data.subtitle_es || ''}
                    onChange={(e) => setData({ ...data, subtitle_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Contenido (ES)</Label>
                  <Textarea
                    value={data.content_es}
                    onChange={(e) => setData({ ...data, content_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={10}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
