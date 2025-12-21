import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, Package, Star, Tag, GripVertical } from "lucide-react";

interface Product {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  subtitle_hu: string | null;
  subtitle_en: string | null;
  subtitle_es: string | null;
  description_hu: string;
  description_en: string;
  description_es: string;
  excerpt_hu: string | null;
  excerpt_en: string | null;
  excerpt_es: string | null;
  product_type: 'DIGITAL' | 'PHYSICAL';
  price_gross: number;
  sale_price: number | null;
  currency: string;
  cover_image_url: string | null;
  file_asset_url: string | null;
  is_featured: boolean;
  is_on_sale: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyProduct: Omit<Product, 'id' | 'created_at'> = {
  title_hu: '',
  title_en: '',
  title_es: '',
  subtitle_hu: '',
  subtitle_en: '',
  subtitle_es: '',
  description_hu: '',
  description_en: '',
  description_es: '',
  excerpt_hu: '',
  excerpt_en: '',
  excerpt_es: '',
  product_type: 'DIGITAL',
  price_gross: 0,
  sale_price: null,
  currency: 'HUF',
  cover_image_url: '',
  file_asset_url: '',
  is_featured: false,
  is_on_sale: false,
  is_active: true,
  sort_order: 0,
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'created_at'>>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'DIGITAL' | 'PHYSICAL'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Hiba a termékek betöltésekor');
      console.error(error);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title_hu: product.title_hu,
      title_en: product.title_en,
      title_es: product.title_es,
      subtitle_hu: product.subtitle_hu || '',
      subtitle_en: product.subtitle_en || '',
      subtitle_es: product.subtitle_es || '',
      description_hu: product.description_hu,
      description_en: product.description_en,
      description_es: product.description_es,
      excerpt_hu: product.excerpt_hu || '',
      excerpt_en: product.excerpt_en || '',
      excerpt_es: product.excerpt_es || '',
      product_type: product.product_type,
      price_gross: product.price_gross,
      sale_price: product.sale_price,
      currency: product.currency,
      cover_image_url: product.cover_image_url || '',
      file_asset_url: product.file_asset_url || '',
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale,
      is_active: product.is_active,
      sort_order: product.sort_order,
    });
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setFormData({
      ...emptyProduct,
      sort_order: products.length,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const productData = {
        ...formData,
        subtitle_hu: formData.subtitle_hu || null,
        subtitle_en: formData.subtitle_en || null,
        subtitle_es: formData.subtitle_es || null,
        excerpt_hu: formData.excerpt_hu || null,
        excerpt_en: formData.excerpt_en || null,
        excerpt_es: formData.excerpt_es || null,
        cover_image_url: formData.cover_image_url || null,
        file_asset_url: formData.file_asset_url || null,
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast.success('Termék frissítve!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Termék létrehozva!');
      }

      setEditDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Biztosan törlöd: "${product.title_hu}"?`)) return;

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', product.id);

    if (error) {
      toast.error('Hiba történt a törlés során');
    } else {
      toast.success('Termék deaktiválva');
      fetchProducts();
    }
  };

  const toggleFeatured = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !product.is_featured })
      .eq('id', product.id);

    if (!error) {
      fetchProducts();
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (!error) {
      fetchProducts();
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter(p => 
    filter === 'all' ? true : p.product_type === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Könyvek / Termékek</h1>
          <p className="text-gray-400">Webshop termékek kezelése</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Új termék
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Összes ({products.length})
        </Button>
        <Button
          variant={filter === 'DIGITAL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('DIGITAL')}
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Digitális ({products.filter(p => p.product_type === 'DIGITAL').length})
        </Button>
        <Button
          variant={filter === 'PHYSICAL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PHYSICAL')}
        >
          <Package className="w-4 h-4 mr-1" />
          Fizikai ({products.filter(p => p.product_type === 'PHYSICAL').length})
        </Button>
      </div>

      {/* Products Table */}
      <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--admin-border))]">
                <TableHead className="text-gray-400 w-10">#</TableHead>
                <TableHead className="text-gray-400">Termék</TableHead>
                <TableHead className="text-gray-400">Típus</TableHead>
                <TableHead className="text-gray-400">Ár</TableHead>
                <TableHead className="text-gray-400 text-center">Kiemelt</TableHead>
                <TableHead className="text-gray-400 text-center">Aktív</TableHead>
                <TableHead className="text-gray-400 text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow key={product.id} className="border-[hsl(var(--admin-border))]">
                  <TableCell className="text-gray-400">
                    <GripVertical className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.title_hu}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{product.title_hu}</p>
                        <p className="text-gray-400 text-xs">{product.subtitle_hu}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.product_type === 'DIGITAL' ? 'default' : 'secondary'}>
                      {product.product_type === 'DIGITAL' ? 'E-könyv' : 'Fizikai'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.is_on_sale && product.sale_price ? (
                        <>
                          <span className="text-green-400 font-bold">
                            {formatPrice(product.sale_price, product.currency)}
                          </span>
                          <span className="text-gray-500 line-through text-sm">
                            {formatPrice(product.price_gross, product.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-white">
                          {formatPrice(product.price_gross, product.currency)}
                        </span>
                      )}
                      {product.is_on_sale && <Tag className="w-4 h-4 text-red-400" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleFeatured(product)}>
                      <Star className={`w-5 h-5 ${product.is_featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => toggleActive(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedProduct ? 'Termék szerkesztése' : 'Új termék'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="hu" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hu">Magyar</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            <TabsContent value="hu" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-300">Cím (HU)</Label>
                  <Input
                    value={formData.title_hu}
                    onChange={(e) => setFormData({ ...formData, title_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Alcím (HU)</Label>
                  <Input
                    value={formData.subtitle_hu || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Leírás (HU)</Label>
                  <Textarea
                    value={formData.description_hu}
                    onChange={(e) => setFormData({ ...formData, description_hu: e.target.value })}
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Részlet (HU)</Label>
                  <Textarea
                    value={formData.excerpt_hu || ''}
                    onChange={(e) => setFormData({ ...formData, excerpt_hu: e.target.value })}
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-300">Title (EN)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtitle (EN)</Label>
                  <Input
                    value={formData.subtitle_en || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Description (EN)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Excerpt (EN)</Label>
                  <Textarea
                    value={formData.excerpt_en || ''}
                    onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="es" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-300">Título (ES)</Label>
                  <Input
                    value={formData.title_es}
                    onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtítulo (ES)</Label>
                  <Input
                    value={formData.subtitle_es || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Descripción (ES)</Label>
                  <Textarea
                    value={formData.description_es}
                    onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Extracto (ES)</Label>
                  <Textarea
                    value={formData.excerpt_es || ''}
                    onChange={(e) => setFormData({ ...formData, excerpt_es: e.target.value })}
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div>
              <Label className="text-gray-300">Típus</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: 'DIGITAL' | 'PHYSICAL') => setFormData({ ...formData, product_type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIGITAL">Digitális (E-könyv)</SelectItem>
                  <SelectItem value="PHYSICAL">Fizikai könyv</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Pénznem</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HUF">HUF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Bruttó ár</Label>
              <Input
                type="number"
                value={formData.price_gross}
                onChange={(e) => setFormData({ ...formData, price_gross: Number(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Akciós ár (opcionális)</Label>
              <Input
                type="number"
                value={formData.sale_price || ''}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Borító URL</Label>
              <Input
                value={formData.cover_image_url || ''}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {formData.product_type === 'DIGITAL' && (
              <div>
                <Label className="text-gray-300">Fájl URL (PDF/EPUB)</Label>
                <Input
                  value={formData.file_asset_url || ''}
                  onChange={(e) => setFormData({ ...formData, file_asset_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            <div>
              <Label className="text-gray-300">Sorrend</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-gray-300">Aktív</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label className="text-gray-300">Kiemelt</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_on_sale}
                onCheckedChange={(checked) => setFormData({ ...formData, is_on_sale: checked })}
              />
              <Label className="text-gray-300">Akciós</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Mentés...' : 'Mentés'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}