import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { campaignSchema, type CampaignFormData } from "@/lib/emailValidation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: any;
}

export function CampaignDialog({ open, onOpenChange, campaign }: CampaignDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!campaign;
  const [uploading, setUploading] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      body_text: "",
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        subject: campaign.subject,
        body_text: campaign.body_text || "",
      });
    } else {
      form.reset({
        name: "",
        subject: "",
        body_text: "",
      });
    }
  }, [campaign, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from('email_campaigns')
          .update({
            name: data.name,
            subject: data.subject,
            body_html: "",
            body_text: data.body_text,
          })
          .eq('id', campaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_campaigns')
          .insert([{
            name: data.name,
            subject: data.subject,
            body_html: "",
            body_text: data.body_text,
            status: 'draft',
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_campaigns'] });
      toast.success(isEditing ? 'Kampány frissítve' : 'Kampány létrehozva');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement file upload logic
      toast.info('Fájl feltöltés fejlesztés alatt');
    } catch (error: any) {
      toast.error(`Hiba a fájl feltöltése során: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: CampaignFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kampány szerkesztése' : 'Új kampány'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kampány neve *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pl. Januári hírlevél" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email tárgy *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Amit a címzettek látnak majd" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email tartalom *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={15}
                      placeholder="Az email tartalma..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Mellékletek</FormLabel>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('campaign-file-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Feltöltés...' : 'Fájl feltöltése'}
                </Button>
                <input
                  id="campaign-file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Max 5MB / fájl, PDF vagy kép formátumok
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Mégse
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Mentés...'
                  : isEditing
                  ? 'Frissítés'
                  : 'Létrehozás'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}