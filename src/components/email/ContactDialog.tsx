import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { contactSchema, type ContactFormData } from "@/lib/emailValidation";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any;
}

export function ContactDialog({ open, onOpenChange, contact }: ContactDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      name: "",
      tags: [],
      country: "",
      is_subscribed: true,
    },
  });

  useEffect(() => {
    if (contact) {
      form.reset({
        email: contact.email,
        name: contact.name || "",
        tags: contact.tags || [],
        country: contact.country || "",
        is_subscribed: contact.is_subscribed,
      });
    } else {
      form.reset({
        email: "",
        name: "",
        tags: [],
        country: "",
        is_subscribed: true,
      });
    }
  }, [contact, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from('contacts')
          .update({
            email: data.email,
            name: data.name,
            tags: data.tags,
            country: data.country,
            is_subscribed: data.is_subscribed,
          })
          .eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([{
            email: data.email,
            name: data.name,
            tags: data.tags,
            country: data.country,
            is_subscribed: data.is_subscribed,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(isEditing ? 'Kontakt frissítve' : 'Kontakt létrehozva');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Hiba: ${error.message}`);
    },
  });

  const onSubmit = (data: ContactFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kontakt szerkesztése' : 'Új kontakt'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Név</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ország</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_subscribed"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Feliratkozva</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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