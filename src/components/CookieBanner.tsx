import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    statistics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      statistics: true,
      marketing: true,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      statistics: false,
      marketing: false,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(necessaryOnly));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto p-6 bg-card border-border shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-foreground">Cookie beállítások</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBanner(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!showSettings ? (
          <>
            <p className="text-muted-foreground mb-6">
              Sütiket használunk, hogy az oldal jól működjön, mérni tudjuk a
              látogatást, és személyre szabhassuk a tartalmat. Te döntöd el, mit
              engedsz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                className="border-border"
              >
                Csak szükséges
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Elfogadok mindent
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="border-border"
              >
                Beállítások
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <Checkbox checked disabled />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Szükséges sütik
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Az oldal alapvető működéséhez szükségesek
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: !!checked })
                  }
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Funkcionális sütik
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Fejlettebb funkciókhoz
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.statistics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, statistics: !!checked })
                  }
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Statisztikai sütik
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Látogatottság mérésére
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: !!checked })
                  }
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Marketing sütik
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Személyre szabott tartalmakhoz
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                className="border-border"
              >
                Vissza
              </Button>
              <Button
                onClick={handleSavePreferences}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Mentés
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
