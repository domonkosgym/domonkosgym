import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    const unsubscribe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("unsubscribe", {
          body: { token },
        });

        if (error) throw error;

        setEmail(data.email);
        setStatus("success");
      } catch (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Leiratkozás</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && <p>Feldolgozás...</p>}
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">
                Sikeresen leiratkozott a hírlevelekről!
              </p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Button onClick={() => window.location.href = "/"}>
                Vissza a főoldalra
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-red-600 font-semibold">
                Hiba történt a leiratkozás során
              </p>
              <p className="text-sm text-muted-foreground">
                Érvénytelen vagy lejárt link
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}