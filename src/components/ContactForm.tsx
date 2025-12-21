import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";

const formSchema = z.object({
  full_name: z.string().min(2, "A név legalább 2 karakter legyen"),
  email: z.string().email("Érvényes email címet adj meg"),
  phone: z.string().optional(),
  interest_type: z.string().min(1, "Válassz érdeklődési területet"),
  message: z.string().optional(),
  gdpr_consent: z.boolean().refine((val) => val === true, {
    message: "Az adatkezelési nyilatkozat elfogadása kötelező",
  }),
  marketing_optin: z.boolean().default(false),
});

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const { trackFormStart, trackFormComplete } = useAnalytics();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      interest_type: "",
      message: "",
      gdpr_consent: false,
      marketing_optin: false,
    },
  });

  // Track form start when user begins filling
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      if (values.full_name || values.email) {
        trackFormStart('contact_form');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, trackFormStart]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        interest_type: values.interest_type,
        message: values.message,
        gdpr_consent: values.gdpr_consent,
        marketing_optin: values.marketing_optin,
      });

      if (error) throw error;

      // Track successful form completion
      await trackFormComplete('contact_form', {
        interest_type: values.interest_type,
        has_phone: !!values.phone,
        has_message: !!values.message,
        marketing_optin: values.marketing_optin
      });

      toast.success("Üzeneted elküldtük! Hamarosan keresünk.");
      form.reset();
    } catch (error) {
      toast.error("Hiba történt. Kérlek próbáld újra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 px-4 md:px-8 bg-secondary/50">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground uppercase mb-3 sm:mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Töltsd ki az űrlapot, és hamarosan keresünk.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('contact.name')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('contact.name')} {...field} className="text-sm sm:text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('contact.email')} *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+36 20 123 4567" {...field} className="text-sm sm:text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interest_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Érdeklődési terület *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Válassz..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Konzultáció">Konzultáció</SelectItem>
                      <SelectItem value="Étrend">Étrend</SelectItem>
                      <SelectItem value="Edzésterv">Edzésterv</SelectItem>
                      <SelectItem value="Arany">Arany csomag</SelectItem>
                      <SelectItem value="Platina">Platina csomag</SelectItem>
                      <SelectItem value="Anti-Aging">Anti-Aging</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">{t('contact.message')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Írd le, miben segíthetek..."
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gdpr_consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 sm:space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs sm:text-sm">
                      Elfogadom az adatkezelési tájékoztatót *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketing_optin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 sm:space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs sm:text-sm">
                      Szeretnék hírlevelet kapni újdonságokról
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-sm sm:text-base"
            >
              {isSubmitting ? "Küldés..." : t('contact.submit')}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
};
