import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, GripVertical, HelpCircle } from "lucide-react";

interface Faq {
  id: string;
  question_hu: string;
  question_en: string;
  question_es: string;
  answer_hu: string;
  answer_en: string;
  answer_es: string;
  display_order: number;
}

const emptyFormData = {
  question_hu: '',
  question_en: '',
  question_es: '',
  answer_hu: '',
  answer_en: '',
  answer_es: '',
  display_order: 0
};

export default function FAQEdit() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });
    
    if (error) {
      console.error(error);
      toast.error("Hiba a FAQ-k betöltésekor");
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingFaq(null);
    setFormData({ ...emptyFormData, display_order: faqs.length });
    setDialogOpen(true);
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question_hu: faq.question_hu,
      question_en: faq.question_en,
      question_es: faq.question_es,
      answer_hu: faq.answer_hu,
      answer_en: faq.answer_en,
      answer_es: faq.answer_es,
      display_order: faq.display_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question_hu.trim() || !formData.answer_hu.trim()) {
      toast.error("A magyar kérdés és válasz kitöltése kötelező");
      return;
    }

    setSaving(true);

    // Auto-fill empty translations with Hungarian text
    const dataToSave = {
      ...formData,
      question_en: formData.question_en.trim() || formData.question_hu,
      question_es: formData.question_es.trim() || formData.question_hu,
      answer_en: formData.answer_en.trim() || formData.answer_hu,
      answer_es: formData.answer_es.trim() || formData.answer_hu,
    };

    if (editingFaq) {
      const { error } = await supabase
        .from("faqs")
        .update(dataToSave)
        .eq("id", editingFaq.id);

      if (error) {
        toast.error("Hiba a mentéskor");
        console.error(error);
      } else {
        toast.success("FAQ frissítve");
        setDialogOpen(false);
        loadFaqs();
      }
    } else {
      const { error } = await supabase
        .from("faqs")
        .insert([dataToSave]);

      if (error) {
        toast.error("Hiba a mentéskor");
        console.error(error);
      } else {
        toast.success("FAQ létrehozva");
        setDialogOpen(false);
        loadFaqs();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a FAQ-t?")) return;

    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
      toast.error("Hiba a törléskor");
    } else {
      toast.success("FAQ törölve");
      loadFaqs();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    
    // Update display_order for both items
    await Promise.all([
      supabase.from("faqs").update({ display_order: index - 1 }).eq("id", newFaqs[index - 1].id),
      supabase.from("faqs").update({ display_order: index }).eq("id", newFaqs[index].id)
    ]);
    
    loadFaqs();
  };

  const handleMoveDown = async (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    
    await Promise.all([
      supabase.from("faqs").update({ display_order: index }).eq("id", newFaqs[index].id),
      supabase.from("faqs").update({ display_order: index + 1 }).eq("id", newFaqs[index + 1].id)
    ]);
    
    loadFaqs();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FAQ Kezelés</h1>
          <p className="text-gray-400 mt-1">Gyakran ismételt kérdések szerkesztése (3 nyelven)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Új FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingFaq ? "FAQ szerkesztése" : "Új FAQ létrehozása"}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="hu" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="hu">Magyar</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="es">Español</TabsTrigger>
              </TabsList>

              <TabsContent value="hu" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Kérdés (HU) *</Label>
                  <Input
                    value={formData.question_hu}
                    onChange={(e) => setFormData({ ...formData, question_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="Írj be egy gyakori kérdést..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Válasz (HU) *</Label>
                  <Textarea
                    value={formData.answer_hu}
                    onChange={(e) => setFormData({ ...formData, answer_hu: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={4}
                    placeholder="Add meg a választ..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Question (EN)</Label>
                  <Input
                    value={formData.question_en}
                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="Enter the question in English..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Answer (EN)</Label>
                  <Textarea
                    value={formData.answer_en}
                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={4}
                    placeholder="Enter the answer in English..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="es" className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-300">Pregunta (ES)</Label>
                  <Input
                    value={formData.question_es}
                    onChange={(e) => setFormData({ ...formData, question_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="Ingresa la pregunta en español..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Respuesta (ES)</Label>
                  <Textarea
                    value={formData.answer_es}
                    onChange={(e) => setFormData({ ...formData, answer_es: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    rows={4}
                    placeholder="Ingresa la respuesta en español..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-4">
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

      {/* FAQ List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ) : faqs.length === 0 ? (
          <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
            <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Még nincsenek FAQ-k</p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Első FAQ hozzáadása
            </Button>
          </Card>
        ) : (
          faqs.map((faq, index) => (
            <Card key={faq.id} className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-start gap-4">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <GripVertical className="w-4 h-4 rotate-90" />
                  </Button>
                  <span className="text-xs text-gray-500 text-center">{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === faqs.length - 1}
                  >
                    <GripVertical className="w-4 h-4 rotate-90" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{faq.question_hu}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{faq.answer_hu}</p>
                  <div className="flex gap-2 mt-2">
                    {faq.question_en && faq.question_en !== faq.question_hu && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">EN</span>
                    )}
                    {faq.question_es && faq.question_es !== faq.question_hu && (
                      <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">ES</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(faq)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
