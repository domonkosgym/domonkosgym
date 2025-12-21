import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Plus, Trash2, Eye, Upload, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CMSSetting = {
  id: string;
  key: string;
  lang: string;
  value: string | null;
  value_json: any;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContentSection = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image";
};

const CONTENT_SECTIONS: { page: string; sections: ContentSection[] }[] = [
  {
    page: "Hero",
    sections: [
      { key: "hero_title", label: "Főcím", type: "text" },
      { key: "hero_subtitle", label: "Alcím", type: "textarea" },
      { key: "hero_cta_primary", label: "Elsődleges gomb szöveg", type: "text" },
      { key: "hero_cta_secondary", label: "Másodlagos gomb szöveg", type: "text" },
      { key: "hero_image", label: "Háttérkép URL", type: "image" },
    ],
  },
  {
    page: "Bio",
    sections: [
      { key: "bio_title", label: "Szekció cím", type: "text" },
      { key: "bio_description", label: "Leírás", type: "textarea" },
      { key: "bio_image", label: "Profilkép URL", type: "image" },
    ],
  },
  {
    page: "Process",
    sections: [
      { key: "process_title", label: "Szekció cím", type: "text" },
      { key: "process_subtitle", label: "Alcím", type: "text" },
      { key: "process_step1_title", label: "1. lépés cím", type: "text" },
      { key: "process_step1_desc", label: "1. lépés leírás", type: "textarea" },
      { key: "process_step2_title", label: "2. lépés cím", type: "text" },
      { key: "process_step2_desc", label: "2. lépés leírás", type: "textarea" },
      { key: "process_step3_title", label: "3. lépés cím", type: "text" },
      { key: "process_step3_desc", label: "3. lépés leírás", type: "textarea" },
    ],
  },
  {
    page: "B2B",
    sections: [
      { key: "b2b_title", label: "Szekció cím", type: "text" },
      { key: "b2b_subtitle", label: "Alcím", type: "text" },
      { key: "b2b_description", label: "Leírás", type: "textarea" },
      { key: "b2b_cta", label: "CTA gomb szöveg", type: "text" },
    ],
  },
  {
    page: "Books",
    sections: [
      { key: "books_title", label: "Szekció cím", type: "text" },
      { key: "books_subtitle", label: "Alcím", type: "text" },
    ],
  },
  {
    page: "Contact",
    sections: [
      { key: "contact_title", label: "Szekció cím", type: "text" },
      { key: "contact_subtitle", label: "Alcím", type: "text" },
      { key: "contact_cta", label: "Küldés gomb szöveg", type: "text" },
    ],
  },
  {
    page: "Footer",
    sections: [
      { key: "footer_copyright", label: "Copyright szöveg", type: "text" },
      { key: "footer_privacy_link", label: "Adatvédelem link szöveg", type: "text" },
      { key: "footer_terms_link", label: "ÁSZF link szöveg", type: "text" },
    ],
  },
];

const LANGUAGES = [
  { code: "hu", label: "Magyar" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export default function CMSEditor() {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState(CONTENT_SECTIONS[0].page);
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, string>>>({});
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", page: "" });

  const { data: cmsSettings, isLoading } = useQuery({
    queryKey: ["cms-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as CMSSetting[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      key,
      lang,
      value,
      isPublished,
    }: {
      key: string;
      lang: string;
      value: string;
      isPublished: boolean;
    }) => {
      const existing = cmsSettings?.find((s) => s.key === key && s.lang === lang);

      if (existing) {
        const { error } = await supabase
          .from("cms_settings")
          .update({ value, is_published: isPublished, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cms_settings").insert({
          key,
          lang,
          value,
          is_published: isPublished,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
      toast.success("Tartalom mentve!");
    },
    onError: (error) => {
      toast.error("Hiba történt: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("cms_settings").delete().eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
      toast.success("Tartalom törölve!");
    },
  });

  const getValue = (key: string, lang: string): string => {
    if (editedValues[key]?.[lang] !== undefined) {
      return editedValues[key][lang];
    }
    const setting = cmsSettings?.find((s) => s.key === key && s.lang === lang);
    return setting?.value || "";
  };

  const isPublished = (key: string): boolean => {
    const setting = cmsSettings?.find((s) => s.key === key);
    return setting?.is_published ?? false;
  };

  const handleChange = (key: string, lang: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [lang]: value,
      },
    }));
  };

  const handleSave = (key: string, publish: boolean) => {
    LANGUAGES.forEach((lang) => {
      const value = getValue(key, lang.code);
      saveMutation.mutate({ key, lang: lang.code, value, isPublished: publish });
    });
  };

  const handleAddKey = () => {
    if (!newKey.key) return;
    LANGUAGES.forEach((lang) => {
      saveMutation.mutate({ key: newKey.key, lang: lang.code, value: "", isPublished: false });
    });
    setNewKeyDialog(false);
    setNewKey({ key: "", page: "" });
  };

  const currentSections = CONTENT_SECTIONS.find((p) => p.page === selectedPage)?.sections || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tartalom szerkesztő (CMS)</h1>
          <p className="text-muted-foreground">Weboldal szövegek és képek kezelése 3 nyelven</p>
        </div>
        <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Új mező
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Új tartalom mező</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Kulcs azonosító</label>
                <Input
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  placeholder="pl. hero_new_field"
                />
              </div>
              <Button onClick={handleAddKey} className="w-full">
                Hozzáadás
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-sm">Oldalak</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {CONTENT_SECTIONS.map((page) => (
                <button
                  key={page.page}
                  onClick={() => setSelectedPage(page.page)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedPage === page.page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {page.page}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 space-y-4">
          {currentSections.map((section) => (
            <Card key={section.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{section.label}</CardTitle>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{section.key}</code>
                    {isPublished(section.key) && (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Publikált
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(section.key, false)}
                      disabled={saveMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Mentés
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(section.key, true)}
                      disabled={saveMutation.isPending}
                    >
                      Publikálás
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hu">
                  <TabsList>
                    {LANGUAGES.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code} className="gap-1">
                        <Globe className="h-3 w-3" />
                        {lang.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {LANGUAGES.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="mt-3">
                      {section.type === "textarea" ? (
                        <Textarea
                          value={getValue(section.key, lang.code)}
                          onChange={(e) => handleChange(section.key, lang.code, e.target.value)}
                          rows={4}
                          placeholder={`${section.label} (${lang.label})`}
                        />
                      ) : section.type === "image" ? (
                        <div className="space-y-2">
                          <Input
                            value={getValue(section.key, lang.code)}
                            onChange={(e) => handleChange(section.key, lang.code, e.target.value)}
                            placeholder="Kép URL"
                          />
                          {getValue(section.key, lang.code) && (
                            <img
                              src={getValue(section.key, lang.code)}
                              alt="Preview"
                              className="h-32 w-auto object-cover rounded-md"
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          value={getValue(section.key, lang.code)}
                          onChange={(e) => handleChange(section.key, lang.code, e.target.value)}
                          placeholder={`${section.label} (${lang.label})`}
                        />
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
