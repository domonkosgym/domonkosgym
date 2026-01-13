import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, BookOpen, Package, Star, Tag, GripVertical, Briefcase, Upload, X, ImageIcon, FileText } from "lucide-react";

// Product types
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

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  category: string;
  image_url: string | null;
  featured: boolean;
  active: boolean;
  slug: string;
  sort_order: number;
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

const serviceCategories = [
  "Kiemelt",
  "Tanácsadás",
  "Táplálkozási terv",
  "Edzésterv",
  "Kombinált csomag"
];

const emptyService = {
  name: "",
  description: "",
  price: 0,
  sale_price: null as number | null,
  is_on_sale: false,
  category: "Tanácsadás",
  image_url: "",
  featured: false,
  active: true,
  slug: "",
  sort_order: 0,
};

export default function ProductsAdmin() {
  const [mainTab, setMainTab] = useState<"books" | "services">("books");
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<Omit<Product, 'id' | 'created_at'>>(emptyProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFilter, setProductFilter] = useState<'all' | 'DIGITAL' | 'PHYSICAL'>('all');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState(emptyService);
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchServices();
  }, []);

  // Products functions
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Hiba a könyvek betöltésekor');
      console.error(error);
    } else {
      setProducts(data as Product[]);
    }
    setLoadingProducts(false);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductFormData({
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
    setEditProductDialogOpen(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setProductFormData({
      ...emptyProduct,
      sort_order: products.length,
    });
    setEditProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    setSavingProduct(true);
    try {
      const productData = {
        ...productFormData,
        subtitle_hu: productFormData.subtitle_hu || null,
        subtitle_en: productFormData.subtitle_en || null,
        subtitle_es: productFormData.subtitle_es || null,
        excerpt_hu: productFormData.excerpt_hu || null,
        excerpt_en: productFormData.excerpt_en || null,
        excerpt_es: productFormData.excerpt_es || null,
        cover_image_url: productFormData.cover_image_url || null,
        file_asset_url: productFormData.file_asset_url || null,
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast.success('Könyv frissítve!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Könyv létrehozva!');
      }

      setEditProductDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Biztosan törlöd: "${product.title_hu}"?`)) return;

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', product.id);

    if (error) {
      toast.error('Hiba történt a törlés során');
    } else {
      toast.success('Könyv deaktiválva');
      fetchProducts();
    }
  };

  const toggleProductFeatured = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !product.is_featured })
      .eq('id', product.id);

    if (!error) fetchProducts();
  };

  const toggleProductActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (!error) fetchProducts();
  };

  // Cover image upload
  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Csak JPG, PNG, WebP vagy GIF formátum engedélyezett');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A fájl mérete maximum 5MB lehet');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName);

      setProductFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Borítókép feltöltve!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Hiba a feltöltés során');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setProductFormData(prev => ({ ...prev, cover_image_url: '' }));
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  // Digital file upload to book-files bucket
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Csak PDF vagy EPUB formátum engedélyezett');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('A fájl mérete maximum 50MB lehet');
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the storage path (not public URL since bucket is private)
      setProductFormData(prev => ({ ...prev, file_asset_url: fileName }));
      toast.success('Digitális fájl feltöltve!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Hiba a feltöltés során');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setProductFormData(prev => ({ ...prev, file_asset_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Services functions
  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("category", { ascending: true });
    
    if (error) {
      console.error("Error loading services:", error);
      toast.error("Hiba a szolgáltatások betöltése során");
    } else {
      setServices(data || []);
    }
    setLoadingServices(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setServiceFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      sale_price: service.sale_price,
      is_on_sale: service.is_on_sale,
      category: service.category,
      image_url: service.image_url || "",
      featured: service.featured,
      active: service.active,
      slug: service.slug,
      sort_order: service.sort_order,
    });
    setEditServiceDialogOpen(true);
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setServiceFormData({
      ...emptyService,
      sort_order: services.length,
    });
    setEditServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    setSavingService(true);
    try {
      const slug = serviceFormData.slug || generateSlug(serviceFormData.name);
      
      const serviceData = {
        name: serviceFormData.name,
        description: serviceFormData.description,
        price: serviceFormData.price,
        sale_price: serviceFormData.sale_price,
        is_on_sale: serviceFormData.is_on_sale,
        category: serviceFormData.category,
        image_url: serviceFormData.image_url || null,
        featured: serviceFormData.featured,
        active: serviceFormData.active,
        slug,
        sort_order: serviceFormData.sort_order,
      };

      if (selectedService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", selectedService.id);
        
        if (error) throw error;
        toast.success("Szolgáltatás frissítve!");
      } else {
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);
        
        if (error) throw error;
        toast.success("Szolgáltatás létrehozva!");
      }

      setEditServiceDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error(error);
      toast.error("Hiba történt a mentés során");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Biztosan törlöd: "${service.name}"?`)) return;
    
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", service.id);
    
    if (error) {
      toast.error("Hiba a szolgáltatás törlése során");
    } else {
      toast.success("Szolgáltatás törölve");
      fetchServices();
    }
  };

  const toggleServiceFeatured = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ featured: !service.featured })
      .eq("id", service.id);

    if (!error) fetchServices();
  };

  const toggleServiceActive = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ active: !service.active })
      .eq("id", service.id);

    if (!error) fetchServices();
  };

  const formatPrice = (price: number, currency: string = 'HUF') => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter(p => 
    productFilter === 'all' ? true : p.product_type === productFilter
  );

  const featuredServices = services.filter(s => s.category === "Kiemelt");
  const otherServices = services.filter(s => s.category !== "Kiemelt");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Könyvek / Szolgáltatások</h1>
          <p className="text-gray-400">Termékek és szolgáltatások kezelése</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "books" | "services")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Könyveim
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Szolgáltatásaim
          </TabsTrigger>
        </TabsList>

        {/* BOOKS TAB */}
        <TabsContent value="books" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant={productFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProductFilter('all')}
              >
                Összes ({products.length})
              </Button>
              <Button
                variant={productFilter === 'DIGITAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProductFilter('DIGITAL')}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Digitális ({products.filter(p => p.product_type === 'DIGITAL').length})
              </Button>
              <Button
                variant={productFilter === 'PHYSICAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProductFilter('PHYSICAL')}
              >
                <Package className="w-4 h-4 mr-1" />
                Fizikai ({products.filter(p => p.product_type === 'PHYSICAL').length})
              </Button>
            </div>
            <Button onClick={handleCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Új könyv
            </Button>
          </div>

          <Card className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
            <CardContent className="p-0">
              {loadingProducts ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[hsl(var(--admin-border))]">
                      <TableHead className="text-gray-400 w-10">#</TableHead>
                      <TableHead className="text-gray-400">Könyv</TableHead>
                      <TableHead className="text-gray-400">Típus</TableHead>
                      <TableHead className="text-gray-400">Ár</TableHead>
                      <TableHead className="text-gray-400 text-center">Kiemelt</TableHead>
                      <TableHead className="text-gray-400 text-center">Aktív</TableHead>
                      <TableHead className="text-gray-400 text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
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
                          <button onClick={() => toggleProductFeatured(product)}>
                            <Star className={`w-5 h-5 ${product.is_featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={() => toggleProductActive(product)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                              <Pencil className="w-4 h-4 text-blue-400" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERVICES TAB */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateService}>
              <Plus className="w-4 h-4 mr-2" />
              Új szolgáltatás
            </Button>
          </div>

          {/* Kiemelt Szolgáltatásunk */}
          {featuredServices.length > 0 && (
            <Card className="p-6 bg-[hsl(var(--admin-card))] border-primary/30 border-2">
              <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                ⭐ Kiemelt Szolgáltatásunk
              </h2>
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--admin-border))]">
                    <TableHead className="text-gray-400">Név</TableHead>
                    <TableHead className="text-gray-400">Ár</TableHead>
                    <TableHead className="text-gray-400 text-center">Akciós</TableHead>
                    <TableHead className="text-gray-400 text-center">Aktív</TableHead>
                    <TableHead className="text-gray-400 text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredServices.map((service) => (
                    <TableRow key={service.id} className="border-[hsl(var(--admin-border))]">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{service.name}</p>
                          <p className="text-gray-400 text-xs truncate max-w-xs">{service.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {service.is_on_sale && service.sale_price !== null ? (
                            <>
                              <span className="text-green-400 font-bold">
                                {service.sale_price === 0 ? 'Ingyenes' : formatPrice(service.sale_price)}
                              </span>
                              <span className="text-gray-500 line-through text-sm">
                                {formatPrice(service.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-white">
                              {service.price === 0 ? 'Ingyenes' : formatPrice(service.price)}
                            </span>
                          )}
                          {service.is_on_sale && <Tag className="w-4 h-4 text-red-400" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {service.is_on_sale ? <Tag className="w-5 h-5 text-red-400 mx-auto" /> : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => toggleServiceActive(service)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Pencil className="w-4 h-4 text-blue-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Többi szolgáltatás */}
          <Card className="p-6 bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
            <h2 className="text-lg font-semibold mb-4 text-white">Egyéb szolgáltatások</h2>
            {loadingServices ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : otherServices.length === 0 ? (
              <p className="text-gray-400">Még nincs szolgáltatás. Hozz létre egyet a fenti gombbal.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--admin-border))]">
                    <TableHead className="text-gray-400">Név</TableHead>
                    <TableHead className="text-gray-400">Kategória</TableHead>
                    <TableHead className="text-gray-400">Ár</TableHead>
                    <TableHead className="text-gray-400 text-center">Kiemelt</TableHead>
                    <TableHead className="text-gray-400 text-center">Akciós</TableHead>
                    <TableHead className="text-gray-400 text-center">Aktív</TableHead>
                    <TableHead className="text-gray-400 text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherServices.map((service) => (
                    <TableRow key={service.id} className="border-[hsl(var(--admin-border))]">
                      <TableCell>
                        <p className="text-white font-medium">{service.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {service.is_on_sale && service.sale_price !== null ? (
                            <>
                              <span className="text-green-400 font-bold">
                                {formatPrice(service.sale_price)}
                              </span>
                              <span className="text-gray-500 line-through text-sm">
                                {formatPrice(service.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-white">
                              {service.price === 0 ? 'Ingyenes' : formatPrice(service.price)}
                            </span>
                          )}
                          {service.is_on_sale && <Tag className="w-4 h-4 text-red-400" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => toggleServiceFeatured(service)}>
                          <Star className={`w-5 h-5 ${service.featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        {service.is_on_sale ? <Tag className="w-5 h-5 text-red-400 mx-auto" /> : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => toggleServiceActive(service)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Pencil className="w-4 h-4 text-blue-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Edit/Create Dialog */}
      <Dialog open={editProductDialogOpen} onOpenChange={setEditProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedProduct ? 'Könyv szerkesztése' : 'Új könyv'}
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
                    value={productFormData.title_hu}
                    onChange={(e) => setProductFormData({ ...productFormData, title_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Alcím (HU)</Label>
                  <Input
                    value={productFormData.subtitle_hu || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, subtitle_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Leírás (HU)</Label>
                  <Textarea
                    value={productFormData.description_hu}
                    onChange={(e) => setProductFormData({ ...productFormData, description_hu: e.target.value })}
                    rows={4}
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
                    value={productFormData.title_en}
                    onChange={(e) => setProductFormData({ ...productFormData, title_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtitle (EN)</Label>
                  <Input
                    value={productFormData.subtitle_en || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, subtitle_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Description (EN)</Label>
                  <Textarea
                    value={productFormData.description_en}
                    onChange={(e) => setProductFormData({ ...productFormData, description_en: e.target.value })}
                    rows={4}
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
                    value={productFormData.title_es}
                    onChange={(e) => setProductFormData({ ...productFormData, title_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Subtítulo (ES)</Label>
                  <Input
                    value={productFormData.subtitle_es || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, subtitle_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Descripción (ES)</Label>
                  <Textarea
                    value={productFormData.description_es}
                    onChange={(e) => setProductFormData({ ...productFormData, description_es: e.target.value })}
                    rows={4}
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
                value={productFormData.product_type}
                onValueChange={(value: 'DIGITAL' | 'PHYSICAL') => setProductFormData({ ...productFormData, product_type: value })}
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
                value={productFormData.currency}
                onValueChange={(value) => setProductFormData({ ...productFormData, currency: value })}
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
                value={productFormData.price_gross}
                onChange={(e) => setProductFormData({ ...productFormData, price_gross: Number(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Akciós ár (opcionális)</Label>
              <Input
                type="number"
                value={productFormData.sale_price || ''}
                onChange={(e) => setProductFormData({ ...productFormData, sale_price: e.target.value ? Number(e.target.value) : null })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-300">Borítókép</Label>
              <div className="mt-2">
                {productFormData.cover_image_url ? (
                  <div className="relative inline-block">
                    <img 
                      src={productFormData.cover_image_url} 
                      alt="Borítókép előnézet" 
                      className="w-40 h-56 object-cover rounded-lg border border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-56 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-800/50">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverUpload(file);
                      }}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                    {uploadingCover ? (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        <span className="text-sm">Feltöltés...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-sm text-center px-2">Kattints a feltöltéshez</span>
                        <span className="text-xs">JPG, PNG, WebP (max 5MB)</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>

            {productFormData.product_type === 'DIGITAL' && (
              <div className="md:col-span-2">
                <Label className="text-gray-300">Digitális fájl (PDF/EPUB)</Label>
                <div className="mt-2">
                  {productFormData.file_asset_url ? (
                    <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-3 rounded-lg bg-primary/20">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Fájl feltöltve</p>
                          <p className="text-gray-400 text-sm truncate max-w-xs">
                            {productFormData.file_asset_url}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-4 p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-800/50">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.epub,application/pdf,application/epub+zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        disabled={uploadingFile}
                      />
                      {uploadingFile ? (
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                          <span>Feltöltés...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-gray-400">
                          <Upload className="w-8 h-8" />
                          <div>
                            <span className="text-white font-medium">Kattints a fájl feltöltéséhez</span>
                            <p className="text-sm">PDF vagy EPUB (max 50MB)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label className="text-gray-300">Sorrend</Label>
              <Input
                type="number"
                value={productFormData.sort_order}
                onChange={(e) => setProductFormData({ ...productFormData, sort_order: Number(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Switch
                checked={productFormData.is_active}
                onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_active: checked })}
              />
              <Label className="text-gray-300">Aktív</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={productFormData.is_featured}
                onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_featured: checked })}
              />
              <Label className="text-gray-300">Kiemelt</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={productFormData.is_on_sale}
                onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_on_sale: checked })}
              />
              <Label className="text-gray-300">Akciós</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditProductDialogOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? 'Mentés...' : 'Mentés'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Edit/Create Dialog */}
      <Dialog open={editServiceDialogOpen} onOpenChange={setEditServiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedService ? 'Szolgáltatás szerkesztése' : 'Új szolgáltatás'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Név *</Label>
              <Input
                value={serviceFormData.name}
                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Leírás *</Label>
              <Textarea
                value={serviceFormData.description}
                onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                rows={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Ár (Ft) *</Label>
                <Input
                  type="number"
                  value={serviceFormData.price}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, price: Number(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Akciós ár (Ft)</Label>
                <Input
                  type="number"
                  value={serviceFormData.sale_price || ''}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, sale_price: e.target.value ? Number(e.target.value) : null })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Kategória *</Label>
              <Select
                value={serviceFormData.category}
                onValueChange={(value) => setServiceFormData({ ...serviceFormData, category: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Válassz kategóriát" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Kép URL</Label>
              <Input
                value={serviceFormData.image_url}
                onChange={(e) => setServiceFormData({ ...serviceFormData, image_url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">URL slug (opcionális)</Label>
              <Input
                value={serviceFormData.slug}
                onChange={(e) => setServiceFormData({ ...serviceFormData, slug: e.target.value })}
                placeholder="Automatikusan generálódik a névből"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Sorrend</Label>
              <Input
                type="number"
                value={serviceFormData.sort_order}
                onChange={(e) => setServiceFormData({ ...serviceFormData, sort_order: Number(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceFormData.active}
                  onCheckedChange={(checked) => setServiceFormData({ ...serviceFormData, active: checked })}
                />
                <Label className="text-gray-300">Aktív</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceFormData.featured}
                  onCheckedChange={(checked) => setServiceFormData({ ...serviceFormData, featured: checked })}
                />
                <Label className="text-gray-300">Kiemelt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceFormData.is_on_sale}
                  onCheckedChange={(checked) => setServiceFormData({ ...serviceFormData, is_on_sale: checked })}
                />
                <Label className="text-gray-300">Akciós</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditServiceDialogOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleSaveService} disabled={savingService}>
                {savingService ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
