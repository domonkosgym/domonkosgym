import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const formSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(1),
  company: z.string().min(2),
  headcount: z.coerce.number().min(8, "Minimum 8 fő szükséges"),
  message: z.string().optional(),
  gdpr_consent: z.boolean().refine((val) => val === true),
});

export default function B2B() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      company: "",
      headcount: 8,
      message: "",
      gdpr_consent: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase.from("leads").insert({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      headcount: values.headcount,
      interest_type: "B2B",
      message: values.message,
      gdpr_consent: values.gdpr_consent,
      marketing_optin: false,
    });

    if (error) {
      toast.error(t('b2b.errorMsg'));
      return;
    }

    toast.success(t('b2b.successMsg'));
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center px-2 sm:px-4 md:px-12 py-3 md:py-6 border-b border-border gap-2">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <a href="/" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.home')}</a>
          <a href="/#about" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.about')}</a>
          <a href="/services" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.services')}</a>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-foreground hover:text-primary text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-9"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Vissza</span>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl py-8 sm:py-16 px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground uppercase mb-6 sm:mb-8 text-center">{t('b2b.pageTitle')}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.company')} *</FormLabel><FormControl><Input {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.contactPerson')} *</FormLabel><FormControl><Input {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.email')} *</FormLabel><FormControl><Input type="email" {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.phone')} *</FormLabel><FormControl><Input {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="headcount" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.headcount')} *</FormLabel><FormControl><Input type="number" {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem><FormLabel className="text-sm">{t('b2b.message')}</FormLabel><FormControl><Textarea {...field} className="text-sm" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gdpr_consent" render={({ field }) => (
              <FormItem className="flex items-start space-x-2 sm:space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs sm:text-sm">{t('b2b.gdpr')} *</FormLabel><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-sm sm:text-base">{t('b2b.submit')}</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}