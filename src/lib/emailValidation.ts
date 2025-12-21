import { z } from "zod";

export const contactSchema = z.object({
  email: z.string().email("Érvényes email címet adj meg"),
  name: z.string().optional(),
  tags: z.array(z.string()).default([]),
  country: z.string().optional(),
  is_subscribed: z.boolean().default(true),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Kampány neve kötelező"),
  subject: z.string().min(1, "Email tárgy kötelező"),
  body_html: z.string().optional(),
  body_text: z.string().min(1, "Szöveges tartalom kötelező"),
});

export const singleEmailSchema = z.object({
  contactId: z.string().uuid("Érvényes kontakt azonosító szükséges"),
  subject: z.string().min(1, "Email tárgy kötelező"),
  bodyHtml: z.string().optional(),
  bodyText: z.string().min(1, "Szöveges tartalom kötelező"),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type SingleEmailFormData = z.infer<typeof singleEmailSchema>;