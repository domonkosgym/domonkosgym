import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

interface Faq {
  id: string;
  question_hu: string;
  answer_hu: string;
  display_order: number;
}

export default function FAQEdit() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("id, question_hu, answer_hu, display_order")
      .order("display_order", { ascending: true });
    setFaqs(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Kérdés és válasz kitöltése kötelező");
      return;
    }

    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : -1;
    const { error } = await supabase.from("faqs").insert({
      question_hu: newQuestion.trim(),
      answer_hu: newAnswer.trim(),
      question_en: newQuestion.trim(),
      answer_en: newAnswer.trim(),
      question_es: newQuestion.trim(),
      answer_es: newAnswer.trim(),
      display_order: maxOrder + 1,
    });

    if (error) {
      toast.error("Hiba történt a mentés során");
      console.error(error);
    } else {
      toast.success("FAQ sikeresen hozzáadva");
      setNewQuestion("");
      setNewAnswer("");
      loadFaqs();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
      toast.error("Hiba történt a törlés során");
    } else {
      toast.success("FAQ törölve");
      loadFaqs();
    }
  };

  const handleUpdate = async (id: string, field: "question_hu" | "answer_hu", value: string) => {
    const updates: any = { [field]: value };
    if (field === "question_hu") {
      updates.question_en = value;
      updates.question_es = value;
    } else {
      updates.answer_en = value;
      updates.answer_es = value;
    }
    const { error } = await supabase.from("faqs").update(updates).eq("id", id);
    if (error) {
      toast.error("Hiba a frissítés során");
    } else {
      toast.success("Mentve");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">FAQ Kezelés</h1>
        <p className="text-muted-foreground">Gyakran ismételt kérdések szerkesztése</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Új FAQ hozzáadása</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Kérdés</label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Írj be egy gyakori kérdést..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Válasz</label>
            <Textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Add meg a választ..."
              className="mt-1"
              rows={4}
            />
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Hozzáadás
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Meglévő FAQ-k</h2>
        {loading ? (
          <Card className="p-6 bg-card border-border">Betöltés...</Card>
        ) : faqs.length === 0 ? (
          <Card className="p-6 bg-card border-border text-muted-foreground">
            Még nincs FAQ
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className="p-6 bg-card border-border space-y-4">
              <div>
                <label className="text-sm font-medium">Kérdés</label>
                <Input
                  defaultValue={faq.question_hu}
                  onBlur={(e) => handleUpdate(faq.id, "question_hu", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Válasz</label>
                <Textarea
                  defaultValue={faq.answer_hu}
                  onBlur={(e) => handleUpdate(faq.id, "answer_hu", e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(faq.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Törlés
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
