import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, Star, MessageCircle, ClipboardList, TrendingUp, Target, Users, Zap, Heart, Award, CheckCircle, Calendar, Dumbbell, Apple, Brain, MessageSquare } from "lucide-react";

const AVAILABLE_ICONS = [
  { name: 'Star', icon: Star },
  { name: 'MessageCircle', icon: MessageCircle },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'ClipboardList', icon: ClipboardList },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Target', icon: Target },
  { name: 'Users', icon: Users },
  { name: 'Zap', icon: Zap },
  { name: 'Heart', icon: Heart },
  { name: 'Award', icon: Award },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'Calendar', icon: Calendar },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Apple', icon: Apple },
  { name: 'Brain', icon: Brain },
];

interface ProcessStep {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  description_hu: string;
  description_en: string;
  description_es: string;
  icon_name: string;
  is_active: boolean;
  sort_order: number;
}

const emptyFormData = {
  title_hu: '',
  title_en: '',
  title_es: '',
  description_hu: '',
  description_en: '',
  description_es: '',
  icon_name: 'Star',
  is_active: true,
  sort_order: 0
};

interface ProcessStepsEditorProps {
  onSave?: () => void;
}

export function ProcessStepsEditor({ onSave }: ProcessStepsEditorProps) {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSteps();
  }, []);

  const loadSteps = async () => {
    const { data, error } = await supabase
      .from("process_steps")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (error) {
      console.error(error);
      toast.error("Hiba a lépések betöltésekor");
    } else {
      setSteps(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingStep(null);
    setFormData({ ...emptyFormData, sort_order: steps.length });
    setDialogOpen(true);
  };

  const openEditDialog = (step: ProcessStep) => {
    setEditingStep(step);
    setFormData({
      title_hu: step.title_hu,
      title_en: step.title_en,
      title_es: step.title_es,
      description_hu: step.description_hu,
      description_en: step.description_en,
      description_es: step.description_es,
      icon_name: step.icon_name,
      is_active: step.is_active,
      sort_order: step.sort_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title_hu.trim() || !formData.description_hu.trim()) {
      toast.error("A magyar cím és leírás kitöltése kötelező");
      return;
    }

    setSaving(true);

    const dataToSave = {
      ...formData,
      title_en: formData.title_en.trim() || formData.title_hu,
      title_es: formData.title_es.trim() || formData.title_hu,
      description_en: formData.description_en.trim() || formData.description_hu,
      description_es: formData.description_es.trim() || formData.description_hu,
    };

    if (editingStep) {
      const { error } = await supabase
        .from("process_steps")
        .update(dataToSave)
        .eq("id", editingStep.id);

      if (error) {
        toast.error("Hiba a mentéskor");
        console.error(error);
      } else {
        toast.success("Lépés frissítve");
        setDialogOpen(false);
        loadSteps();
        onSave?.();
      }
    } else {
      const { error } = await supabase
        .from("process_steps")
        .insert([dataToSave]);

      if (error) {
        toast.error("Hiba a mentéskor");
        console.error(error);
      } else {
        toast.success("Lépés létrehozva");
        setDialogOpen(false);
        loadSteps();
        onSave?.();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a lépést?")) return;

    const { error } = await supabase.from("process_steps").delete().eq("id", id);
    if (error) {
      toast.error("Hiba a törléskor");
    } else {
      toast.success("Lépés törölve");
      loadSteps();
      onSave?.();
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconConfig = AVAILABLE_ICONS.find(i => i.name === iconName);
    if (iconConfig) {
      const IconComponent = iconConfig.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <Star className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-muted rounded"></div>
        <div className="h-16 bg-muted rounded"></div>
        <div className="h-16 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground">Folyamat lépései</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Új lépés
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingStep ? "Lépés szerkesztése" : "Új lépés létrehozása"}
              </DialogTitle>
            </DialogHeader>

            {/* Icon Selection */}
            <div className="mt-4">
              <Label className="text-muted-foreground mb-2 block">Ikon kiválasztása</Label>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {AVAILABLE_ICONS.map((iconConfig) => {
                  const IconComponent = iconConfig.icon;
                  return (
                    <button
                      key={iconConfig.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_name: iconConfig.name })}
                      className={`p-2 sm:p-3 rounded-lg border transition-all ${
                        formData.icon_name === iconConfig.name
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                      }`}
                      title={iconConfig.name}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Tabs defaultValue="hu" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="hu">Magyar</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="es">Español</TabsTrigger>
              </TabsList>

              <TabsContent value="hu" className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Cím (HU) *</Label>
                  <Input
                    value={formData.title_hu}
                    onChange={(e) => setFormData({ ...formData, title_hu: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                    placeholder="pl. 1. Ingyenes konzultáció"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Leírás (HU) *</Label>
                  <Textarea
                    value={formData.description_hu}
                    onChange={(e) => setFormData({ ...formData, description_hu: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Title (EN)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Description (EN)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="es" className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground">Título (ES)</Label>
                  <Input
                    value={formData.title_es}
                    onChange={(e) => setFormData({ ...formData, title_es: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Descripción (ES)</Label>
                  <Textarea
                    value={formData.description_es}
                    onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Mentés..." : "Mentés"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Még nincsenek lépések</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-2">
              <Plus className="w-4 h-4 mr-1" />
              Első lépés hozzáadása
            </Button>
          </div>
        ) : (
          steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                {getIconComponent(step.icon_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{step.title_hu}</p>
                <p className="text-xs text-muted-foreground truncate">{step.description_hu}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(step)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(step.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
