import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload, ImageIcon, Trash2, RefreshCw } from "lucide-react";

interface SiteImage {
  id: string;
  image_key: string;
  label_hu: string;
  label_en: string;
  image_url: string | null;
  description: string | null;
}

export default function SiteImagesAdmin() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const { data, error } = await supabase
      .from("site_images")
      .select("*")
      .order("image_key");

    if (error) {
      console.error(error);
      toast.error("Hiba az adatok betöltésekor");
    } else if (data) {
      setImages(data);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFor(imageKey);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `site-${imageKey}-${Date.now()}.${fileExt}`;
    const filePath = `site-images/${fileName}`;

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

    // Update database
    const { error: updateError } = await supabase
      .from("site_images")
      .update({ image_url: publicUrl })
      .eq("image_key", imageKey);

    if (updateError) {
      toast.error('Hiba a mentéskor');
      console.error(updateError);
    } else {
      setImages(prev => prev.map(img => 
        img.image_key === imageKey ? { ...img, image_url: publicUrl } : img
      ));
      toast.success('Kép feltöltve és mentve');
    }
    
    setUploadingFor(null);
    
    // Reset input
    const inputRef = fileInputRefs.current[imageKey];
    if (inputRef) {
      inputRef.value = '';
    }
  };

  const removeImage = async (imageKey: string) => {
    const { error } = await supabase
      .from("site_images")
      .update({ image_url: null })
      .eq("image_key", imageKey);

    if (error) {
      toast.error('Hiba a törléskor');
      console.error(error);
    } else {
      setImages(prev => prev.map(img => 
        img.image_key === imageKey ? { ...img, image_url: null } : img
      ));
      toast.success('Kép eltávolítva');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Főoldal Képek</h1>
          <p className="text-gray-400 mt-1">Kezeld a landing page és más oldalak képeit</p>
        </div>
        <Button variant="outline" onClick={loadImages} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Frissítés
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="bg-gray-800/50 border-gray-700 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{image.label_hu}</CardTitle>
              {image.description && (
                <CardDescription className="text-gray-400 text-sm">
                  {image.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {image.image_url ? (
                <div className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                    <img 
                      src={image.image_url} 
                      alt={image.label_hu}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRefs.current[image.image_key]?.click()}
                      disabled={uploadingFor === image.image_key}
                    >
                      {uploadingFor === image.image_key ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Csere
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.image_key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="aspect-video rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
                  onClick={() => fileInputRefs.current[image.image_key]?.click()}
                >
                  {uploadingFor === image.image_key ? (
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
                ref={(el) => { fileInputRefs.current[image.image_key] = el; }}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, image.image_key)}
                className="hidden"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Tipp</h3>
            <p className="text-gray-400 text-sm">
              A képek automatikusan mentődnek feltöltéskor. Az optimális megjelenítéshez ajánlott képméret:
              <br />
              • Hero kép: 1920x1080 px (16:9 arány)
              <br />
              • Szekció képek: 800x600 px (4:3 arány)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
