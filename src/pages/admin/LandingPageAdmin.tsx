import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff } from "lucide-react";

type LandingSection = {
  id: string;
  section_key: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  is_active: boolean;
  sort_order: number;
};

export default function LandingPageAdmin() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["landing-sections-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_sections")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as LandingSection[];
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("landing_page_sections")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-sections-admin"] });
      queryClient.invalidateQueries({ queryKey: ["landing-sections"] });
      toast.success("Szekció frissítve");
    },
    onError: () => {
      toast.error("Hiba történt a mentés során");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("landing_page_sections")
          .update({ sort_order: update.sort_order, updated_at: new Date().toISOString() })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-sections-admin"] });
      queryClient.invalidateQueries({ queryKey: ["landing-sections"] });
      toast.success("Sorrend mentve");
    },
    onError: () => {
      toast.error("Hiba történt a sorrend mentésekor");
    },
  });

  const moveSection = (index: number, direction: "up" | "down") => {
    if (!sections) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    const updates = newSections.map((section, idx) => ({
      id: section.id,
      sort_order: idx + 1,
    }));

    updateOrderMutation.mutate(updates);
  };

  const getSectionDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      hero: "A főoldal tetején megjelenő nagy banner kép és szöveg",
      books: "Könyvek és termékek szekció",
      train_hard: "Motivációs szlogen szekció",
      featured_in: "Média megjelenések és linkek",
      bio: "Bemutatkozás szekció",
      process: "Hogyan működik lépések",
      b2b: "Vállalati ajánlatok szekció",
      faq: "Gyakran ismételt kérdések",
      contact: "Kapcsolatfelvételi űrlap",
    };
    return descriptions[key] || "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Főoldal szekciók</h1>
        <p className="text-muted-foreground mt-1">
          A főoldal szekciók sorrendjének és láthatóságának kezelése
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Szekciók</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections?.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                section.is_active 
                  ? "bg-card border-border" 
                  : "bg-muted/50 border-border/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-4 w-4 rotate-90" />
                    <span className="sr-only">Fel</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSection(index, "down")}
                    disabled={index === (sections?.length ?? 0) - 1}
                  >
                    <GripVertical className="h-4 w-4 -rotate-90" />
                    <span className="sr-only">Le</span>
                  </Button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {section.title_hu}
                    </h3>
                    {section.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getSectionDescription(section.section_key)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${section.id}`} className="text-sm">
                  {section.is_active ? "Aktív" : "Inaktív"}
                </Label>
                <Switch
                  id={`active-${section.id}`}
                  checked={section.is_active}
                  onCheckedChange={(checked) =>
                    updateSectionMutation.mutate({ id: section.id, is_active: checked })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tippek</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• A szekciók sorrendjét a fel/le nyilakkal módosíthatod</p>
          <p>• A kapcsolóval ki-be kapcsolhatod az egyes szekciókat</p>
          <p>• A kikapcsolt szekciók nem jelennek meg a főoldalon</p>
          <p>• A szekciók tartalmát a "Tartalom (CMS)" menüpontban szerkesztheted</p>
          <p>• A képeket a "Főoldal Képek" menüpontban cserélheted</p>
        </CardContent>
      </Card>
    </div>
  );
}
