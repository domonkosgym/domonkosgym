import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject_hu: string;
  subject_en: string;
  subject_es: string;
  body_html_hu: string;
  body_html_en: string;
  body_html_es: string;
  description: string | null;
  is_active: boolean;
}

export function AutomaticEmailsTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('template_key');

    if (error) {
      toast.error('Hiba a sablonok betöltésekor');
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('email_templates')
      .update({
        name: editingTemplate.name,
        subject_hu: editingTemplate.subject_hu,
        subject_en: editingTemplate.subject_en,
        subject_es: editingTemplate.subject_es,
        body_html_hu: editingTemplate.body_html_hu,
        body_html_en: editingTemplate.body_html_en,
        body_html_es: editingTemplate.body_html_es,
        is_active: editingTemplate.is_active
      })
      .eq('id', editingTemplate.id);

    if (error) {
      toast.error('Hiba a mentéskor');
      console.error(error);
    } else {
      toast.success('Sablon mentve');
      setEditingTemplate(null);
      fetchTemplates();
    }
    setIsSaving(false);
  };

  const toggleActive = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: !template.is_active })
      .eq('id', template.id);

    if (error) {
      toast.error('Hiba a státusz változtatásakor');
    } else {
      fetchTemplates();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Az automata üzenetekben használható változók:
          <ul className="list-disc list-inside mt-2 text-sm">
            <li><code className="bg-muted px-1 rounded">{"{{customer_name}}"}</code> - Vásárló neve</li>
            <li><code className="bg-muted px-1 rounded">{"{{order_id}}"}</code> - Rendelésszám</li>
            <li><code className="bg-muted px-1 rounded">{"{{order_items}}"}</code> - Rendelt termékek listája</li>
            <li><code className="bg-muted px-1 rounded">{"{{total_amount}}"}</code> - Összeg</li>
            <li><code className="bg-muted px-1 rounded">{"{{shipping_address}}"}</code> - Szállítási cím</li>
            <li><code className="bg-muted px-1 rounded">{"{{billing_address}}"}</code> - Számlázási cím</li>
            <li><code className="bg-muted px-1 rounded">{"{{company_name}}"}</code> - Cégnév</li>
            <li><code className="bg-muted px-1 rounded">{"{{company_phone}}"}</code> - Kapcsolattartó telefon</li>
            <li><code className="bg-muted px-1 rounded">{"{{company_email}}"}</code> - Kapcsolattartó email</li>
            <li><code className="bg-muted px-1 rounded">{"{{service_name}}"}</code> - Szolgáltatás neve</li>
            <li><code className="bg-muted px-1 rounded">{"{{booking_date}}"}</code> - Foglalás dátuma</li>
            <li><code className="bg-muted px-1 rounded">{"{{booking_time}}"}</code> - Foglalás időpontja</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{template.name}</h3>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Aktív' : 'Inaktív'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <p className="text-sm"><strong>Tárgy:</strong> {template.subject_hu}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={() => toggleActive(template)}
                />
                <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Szerkesztés
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email sablon szerkesztése</DialogTitle>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-6">
              <div>
                <Label>Sablon neve</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tárgy (Magyar)</Label>
                  <Input
                    value={editingTemplate.subject_hu}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject_hu: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tárgy (Angol)</Label>
                  <Input
                    value={editingTemplate.subject_en}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tárgy (Spanyol)</Label>
                  <Input
                    value={editingTemplate.subject_es}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject_es: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Email törzs - Magyar (HTML)</Label>
                <Textarea
                  value={editingTemplate.body_html_hu}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html_hu: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Email törzs - Angol (HTML)</Label>
                <Textarea
                  value={editingTemplate.body_html_en}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html_en: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Email törzs - Spanyol (HTML)</Label>
                <Textarea
                  value={editingTemplate.body_html_es}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html_es: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingTemplate.is_active}
                  onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, is_active: checked })}
                />
                <Label>Aktív</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Mégse
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Mentés...' : 'Mentés'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
