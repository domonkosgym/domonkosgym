import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RefreshCw, Palette, Type, Square, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ThemeSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
};

const DEFAULT_THEME_SETTINGS = [
  // Colors
  { key: "color_primary", value: "#ea384c", description: "Elsődleges szín (pl. gombok, linkek)" },
  { key: "color_secondary", value: "#1e293b", description: "Másodlagos szín" },
  { key: "color_accent", value: "#f97316", description: "Kiemelő szín (akciók, badge-ek)" },
  { key: "color_background", value: "#ffffff", description: "Háttérszín" },
  { key: "color_foreground", value: "#0f172a", description: "Szövegszín" },
  { key: "color_muted", value: "#f1f5f9", description: "Halvány háttér" },
  { key: "color_muted_foreground", value: "#64748b", description: "Halvány szöveg" },
  
  // Button styles
  { key: "button_primary_bg", value: "#ea384c", description: "Elsődleges gomb háttér" },
  { key: "button_primary_text", value: "#ffffff", description: "Elsődleges gomb szöveg" },
  { key: "button_secondary_bg", value: "#1e293b", description: "Másodlagos gomb háttér" },
  { key: "button_secondary_text", value: "#ffffff", description: "Másodlagos gomb szöveg" },
  { key: "button_border_radius", value: "8", description: "Gomb lekerekítés (px)" },
  
  // Typography
  { key: "font_family_heading", value: "Inter", description: "Címek betűtípus" },
  { key: "font_family_body", value: "Inter", description: "Szövegtörzs betűtípus" },
  { key: "font_size_base", value: "16", description: "Alap betűméret (px)" },
  
  // Spacing
  { key: "section_padding", value: "80", description: "Szekciók belső margó (px)" },
  { key: "container_max_width", value: "1280", description: "Tartalom max szélesség (px)" },
];

export default function ThemeEditor() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ["theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as ThemeSetting[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string; description: string }[]) => {
      for (const setting of settings) {
        const existing = themeSettings?.find((s) => s.key === setting.key);
        
        if (existing) {
          const { error } = await supabase
            .from("theme_settings")
            .update({ value: setting.value, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("theme_settings").insert({
            key: setting.key,
            value: setting.value,
            description: setting.description,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast.success("Téma beállítások mentve!");
      setEditedValues({});
    },
    onError: (error) => {
      toast.error("Hiba történt: " + error.message);
    },
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      for (const setting of DEFAULT_THEME_SETTINGS) {
        const existing = themeSettings?.find((s) => s.key === setting.key);
        if (!existing) {
          const { error } = await supabase.from("theme_settings").insert(setting);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast.success("Alapértelmezett beállítások létrehozva!");
    },
  });

  const getValue = (key: string): string => {
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    const setting = themeSettings?.find((s) => s.key === key);
    if (setting) return setting.value;
    const defaultSetting = DEFAULT_THEME_SETTINGS.find((s) => s.key === key);
    return defaultSetting?.value || "";
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = () => {
    const settingsToSave = DEFAULT_THEME_SETTINGS.map((setting) => ({
      key: setting.key,
      value: getValue(setting.key),
      description: setting.description,
    }));
    saveMutation.mutate(settingsToSave);
  };

  const colorSettings = DEFAULT_THEME_SETTINGS.filter((s) => s.key.startsWith("color_"));
  const buttonSettings = DEFAULT_THEME_SETTINGS.filter((s) => s.key.startsWith("button_"));
  const typographySettings = DEFAULT_THEME_SETTINGS.filter((s) => s.key.startsWith("font_"));
  const spacingSettings = DEFAULT_THEME_SETTINGS.filter((s) => 
    s.key.startsWith("section_") || s.key.startsWith("container_")
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  const hasNoSettings = !themeSettings || themeSettings.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Design beállítások</h1>
          <p className="text-muted-foreground">Színek, gombok, betűtípusok és térközök kezelése</p>
        </div>
        <div className="flex gap-2">
          {hasNoSettings && (
            <Button
              variant="outline"
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Alapértékek betöltése
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Előnézet elrejtése" : "Előnézet"}
          </Button>
          <Button onClick={handleSaveAll} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Mentés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="colors">
            <TabsList className="mb-4">
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="h-4 w-4" />
                Színek
              </TabsTrigger>
              <TabsTrigger value="buttons" className="gap-2">
                <Square className="h-4 w-4" />
                Gombok
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-2">
                <Type className="h-4 w-4" />
                Tipográfia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors">
              <Card>
                <CardHeader>
                  <CardTitle>Színpaletta</CardTitle>
                  <CardDescription>A weboldal fő színeinek beállítása</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colorSettings.map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label>{setting.description}</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={getValue(setting.key)}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={getValue(setting.key)}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buttons">
              <Card>
                <CardHeader>
                  <CardTitle>Gomb stílusok</CardTitle>
                  <CardDescription>Gombok megjelenésének testreszabása</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buttonSettings.map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label>{setting.description}</Label>
                        {setting.key.includes("radius") ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              type="range"
                              min="0"
                              max="24"
                              value={getValue(setting.key)}
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-12">
                              {getValue(setting.key)}px
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={getValue(setting.key)}
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={getValue(setting.key)}
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography">
              <Card>
                <CardHeader>
                  <CardTitle>Tipográfia</CardTitle>
                  <CardDescription>Betűtípusok és méretek</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typographySettings.map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label>{setting.description}</Label>
                        {setting.key.includes("size") ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              type="range"
                              min="12"
                              max="24"
                              value={getValue(setting.key)}
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-12">
                              {getValue(setting.key)}px
                            </span>
                          </div>
                        ) : (
                          <Input
                            value={getValue(setting.key)}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            placeholder="Inter, sans-serif"
                          />
                        )}
                      </div>
                    ))}
                    {spacingSettings.map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label>{setting.description}</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={getValue(setting.key)}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">px</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {previewMode && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Előnézet</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 rounded-lg space-y-4"
                  style={{ backgroundColor: getValue("color_background") }}
                >
                  <h3
                    className="text-xl font-bold"
                    style={{
                      color: getValue("color_foreground"),
                      fontFamily: getValue("font_family_heading"),
                    }}
                  >
                    Minta címsor
                  </h3>
                  <p
                    style={{
                      color: getValue("color_muted_foreground"),
                      fontFamily: getValue("font_family_body"),
                      fontSize: `${getValue("font_size_base")}px`,
                    }}
                  >
                    Ez egy minta bekezdés szöveg a téma előnézetéhez.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 font-medium"
                      style={{
                        backgroundColor: getValue("button_primary_bg"),
                        color: getValue("button_primary_text"),
                        borderRadius: `${getValue("button_border_radius")}px`,
                      }}
                    >
                      Elsődleges
                    </button>
                    <button
                      className="px-4 py-2 font-medium"
                      style={{
                        backgroundColor: getValue("button_secondary_bg"),
                        color: getValue("button_secondary_text"),
                        borderRadius: `${getValue("button_border_radius")}px`,
                      }}
                    >
                      Másodlagos
                    </button>
                  </div>
                  <div
                    className="p-3 rounded"
                    style={{ backgroundColor: getValue("color_muted") }}
                  >
                    <span
                      className="text-sm"
                      style={{ color: getValue("color_accent") }}
                    >
                      ★ Kiemelt tartalom
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
