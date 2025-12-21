import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  featured: boolean;
  active: boolean;
  slug: string;
}

const categories = [
  "Kiemelt",
  "Tanácsadás",
  "Táplálkozási terv",
  "Edzésterv",
  "Kombinált csomag"
];

export default function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    featured: false,
    active: true,
    slug: ""
  });

  useEffect(() => {
    loadServices();
    
    // Realtime subscription
    const channel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          loadServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true })
      .order("price", { ascending: true });
    
    if (error) {
      console.error("Error loading services:", error);
      toast.error("Hiba a szolgáltatások betöltése során");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast.error("Kérjük töltse ki az összes kötelező mezőt");
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: formData.image_url || null,
      featured: formData.featured,
      active: formData.active,
      slug
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);
      
      if (error) {
        console.error("Error updating service:", error);
        toast.error("Hiba a szolgáltatás frissítése során");
      } else {
        toast.success("Szolgáltatás sikeresen frissítve");
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("services")
        .insert([serviceData]);
      
      if (error) {
        console.error("Error creating service:", error);
        toast.error("Hiba a szolgáltatás létrehozása során");
      } else {
        toast.success("Szolgáltatás sikeresen létrehozva");
        resetForm();
      }
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
      image_url: service.image_url || "",
      featured: service.featured,
      active: service.active,
      slug: service.slug
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné ezt a szolgáltatást?")) return;
    
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting service:", error);
      toast.error("Hiba a szolgáltatás törlése során");
    } else {
      toast.success("Szolgáltatás sikeresen törölve");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      featured: false,
      active: true,
      slug: ""
    });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Szolgáltatások kezelése</h1>
          <p className="text-muted-foreground">
            Szolgáltatások hozzáadása, szerkesztése és törlése
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Új szolgáltatás
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Szolgáltatás szerkesztése" : "Új szolgáltatás"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Leírás *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Ár (Ft) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Kategória *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon kategóriát" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="image_url">Kép URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjon meg egy kép URL-t, vagy hagyja üresen egy alapértelmezett képhez
                </p>
              </div>
              
              <div>
                <Label htmlFor="slug">URL slug (opcionális)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Automatikusan generálódik a névből"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label htmlFor="featured">Kiemelt szolgáltatás</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Aktív</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Mégse
                </Button>
                <Button type="submit">
                  {editingService ? "Mentés" : "Létrehozás"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kiemelt Szolgáltatásunk szekció */}
      {services.filter(s => s.category === "Kiemelt").length > 0 && (
        <Card className="p-6 bg-card border-primary/30 border-2">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            ⭐ Kiemelt Szolgáltatásunk
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Név</TableHead>
                  <TableHead>Leírás</TableHead>
                  <TableHead className="text-right">Ár</TableHead>
                  <TableHead className="text-center">Aktív</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.filter(s => s.category === "Kiemelt").map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                    <TableCell className="text-right">
                      {service.price === 0 ? "Ingyenes" : `${service.price.toLocaleString("hu-HU")} Ft`}
                    </TableCell>
                    <TableCell className="text-center">
                      {service.active ? "✓" : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Többi szolgáltatás */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Egyéb szolgáltatások</h2>
        {loading ? (
          <p>Betöltés...</p>
        ) : services.filter(s => s.category !== "Kiemelt").length === 0 ? (
          <p className="text-muted-foreground">Még nincs szolgáltatás. Hozzon létre egyet a fenti gombbal.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Név</TableHead>
                  <TableHead>Kategória</TableHead>
                  <TableHead className="text-right">Ár</TableHead>
                  <TableHead className="text-center">Kiemelt</TableHead>
                  <TableHead className="text-center">Aktív</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.filter(s => s.category !== "Kiemelt").map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell className="text-right">
                      {service.price.toLocaleString("hu-HU")} Ft
                    </TableCell>
                    <TableCell className="text-center">
                      {service.featured ? "✓" : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {service.active ? "✓" : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
