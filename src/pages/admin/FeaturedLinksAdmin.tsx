import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Upload, X, ImageIcon, GripVertical } from "lucide-react";

interface FeaturedLink {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  description_hu: string | null;
  description_en: string | null;
  description_es: string | null;
  url: string;
  cover_image_url: string | null;
  is_youtube: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyFormData: Omit<FeaturedLink, 'id'> = {
  title_hu: '',
  title_en: '',
  title_es: '',
  description_hu: '',
  description_en: '',
  description_es: '',
  url: '',
  cover_image_url: null,
  is_youtube: false,
  is_active: true,
  sort_order: 0
};

export default function FeaturedLinksAdmin() {
  const [links, setLinks] = useState<FeaturedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FeaturedLink | null>(null);
  const [formData, setFormData] = useState<Omit<FeaturedLink, 'id'>>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('featured_links')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Hiba a linkek betöltésekor');
      console.error(error);
    } else {
      setLinks(data || []);
    }
    setLoading(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `featured-links/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Hiba a kép feltöltésekor');
      console.error(uploadError);
      setUploadingCover(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath);

    setFormData({ ...formData, cover_image_url: publicUrl });
    setUploadingCover(false);
    toast.success('Borítókép feltöltve');
  };

  const handleRemoveCover = () => {
    setFormData({ ...formData, cover_image_url: null });
  };

  const openCreateDialog = () => {
    setEditingLink(null);
    setFormData({ ...emptyFormData, sort_order: links.length });
    setDialogOpen(true);
  };

  const openEditDialog = (link: FeaturedLink) => {
    setEditingLink(link);
    setFormData({
      title_hu: link.title_hu,
      title_en: link.title_en,
      title_es: link.title_es,
      description_hu: link.description_hu || '',
      description_en: link.description_en || '',
      description_es: link.description_es || '',
      url: link.url,
      cover_image_url: link.cover_image_url,
      is_youtube: link.is_youtube,
      is_active: link.is_active,
      sort_order: link.sort_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title_hu || !formData.url) {
      toast.error('Cím és URL megadása kötelező');
      return;
    }

    setSaving(true);

    if (editingLink) {
      const { error } = await supabase
        .from('featured_links')
        .update(formData)
        .eq('id', editingLink.id);

      if (error) {
        toast.error('Hiba a mentéskor');
        console.error(error);
      } else {
        toast.success('Link frissítve');
        setDialogOpen(false);
        fetchLinks();
      }
    } else {
      const { error } = await supabase
        .from('featured_links')
        .insert([formData]);

      if (error) {
        toast.error('Hiba a mentéskor');
        console.error(error);
      } else {
        toast.success('Link létrehozva');
        setDialogOpen(false);
        fetchLinks();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a linket?')) return;

    const { error } = await supabase
      .from('featured_links')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Hiba a törléskor');
      console.error(error);
    } else {
      toast.success('Link törölve');
      fetchLinks();
    }
  };

  const handleToggleActive = async (link: FeaturedLink) => {
    const { error } = await supabase
      .from('featured_links')
      .update({ is_active: !link.is_active })
      .eq('id', link.id);

    if (error) {
      toast.error('Hiba a státusz módosításakor');
    } else {
      fetchLinks();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Megjelenések / Linkek</h1>
          <p className="text-gray-400 mt-1">Külső linkek és megjelenések kezelése</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Új link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingLink ? 'Link szerkesztése' : 'Új link létrehozása'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Cover Image Upload */}
              <div>
                <Label className="text-gray-300 mb-2 block">Borítókép</Label>
                {formData.cover_image_url ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                    <img 
                      src={formData.cover_image_url} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveCover}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-400">Kattints a feltöltéshez</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>

              {/* URL */}
              <div>
                <Label className="text-gray-300">URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              {/* YouTube Toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_youtube}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_youtube: checked })}
                />
                <Label className="text-gray-300">YouTube link (piros háttér, YouTube ikon)</Label>
              </div>

              {/* Language Tabs */}
              <Tabs defaultValue="hu" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="hu">Magyar</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="es">Español</TabsTrigger>
                </TabsList>

                <TabsContent value="hu" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Cím (HU) *</Label>
                    <Input
                      value={formData.title_hu}
                      onChange={(e) => setFormData({ ...formData, title_hu: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Leírás (HU)</Label>
                    <Textarea
                      value={formData.description_hu || ''}
                      onChange={(e) => setFormData({ ...formData, description_hu: e.target.value })}
                      rows={2}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Title (EN) *</Label>
                    <Input
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Description (EN)</Label>
                    <Textarea
                      value={formData.description_en || ''}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={2}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="es" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Título (ES) *</Label>
                    <Input
                      value={formData.title_es}
                      onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Descripción (ES)</Label>
                    <Textarea
                      value={formData.description_es || ''}
                      onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                      rows={2}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Sort Order */}
              <div>
                <Label className="text-gray-300">Sorrend</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700 text-white w-24"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-gray-300">Aktív (megjelenik a weboldalon)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links List */}
      <div className="grid gap-4">
        {links.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <ExternalLink className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Még nincsenek linkek</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Első link hozzáadása
              </Button>
            </CardContent>
          </Card>
        ) : (
          links.map((link) => (
            <Card key={link.id} className={`bg-gray-800/50 border-gray-700 ${!link.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Cover/YouTube Icon */}
                  <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-700">
                    {link.is_youtube ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-600">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    ) : link.cover_image_url ? (
                      <img src={link.cover_image_url} alt={link.title_hu} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{link.title_hu}</h3>
                    <p className="text-sm text-gray-400 truncate">{link.url}</p>
                    {link.description_hu && (
                      <p className="text-sm text-gray-500 truncate">{link.description_hu}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${link.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {link.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(link)}
                      title={link.is_active ? 'Inaktiválás' : 'Aktiválás'}
                    >
                      <Switch checked={link.is_active} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(link)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
