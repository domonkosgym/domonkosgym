import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalComModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalComModal = ({ open, onOpenChange }: CalComModalProps) => {
  useEffect(() => {
    if (open) {
      // Cal.com embed script betöltése
      const script = document.createElement("script");
      script.src = "https://app.cal.com/embed/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Ingyenes konzultáció foglalása
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div
            data-cal-link="demo/15min"
            data-cal-config='{"layout":"month_view"}'
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
          >
            <p className="text-muted-foreground text-center p-8">
              Cal.com betöltése... <br />
              <span className="text-sm">
                (Helyettesítsd a data-cal-link értéket a saját Cal.com linkeddel)
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
