export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      about_page: {
        Row: {
          achievements: string[] | null
          content_en: string
          content_es: string
          content_hu: string
          created_at: string | null
          id: string
          image_url: string | null
          subtitle_en: string | null
          subtitle_es: string | null
          subtitle_hu: string | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at: string | null
        }
        Insert: {
          achievements?: string[] | null
          content_en: string
          content_es: string
          content_hu: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          subtitle_en?: string | null
          subtitle_es?: string | null
          subtitle_hu?: string | null
          title_en?: string
          title_es?: string
          title_hu?: string
          updated_at?: string | null
        }
        Update: {
          achievements?: string[] | null
          content_en?: string
          content_es?: string
          content_hu?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          subtitle_en?: string | null
          subtitle_es?: string | null
          subtitle_hu?: string | null
          title_en?: string
          title_es?: string
          title_hu?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: []
      }
      blocked_time_slots: {
        Row: {
          all_day: boolean
          blocked_date: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          reason: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          blocked_date: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          blocked_date?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          billing_address: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          duration_minutes: number
          id: string
          notes: string | null
          paid: boolean | null
          price: number
          reschedule_count: number
          scheduled_date: string
          scheduled_time: string
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          paid?: boolean | null
          price?: number
          reschedule_count?: number
          scheduled_date: string
          scheduled_time: string
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          paid?: boolean | null
          price?: number
          reschedule_count?: number
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_settings: {
        Row: {
          created_at: string | null
          id: string
          is_published: boolean | null
          key: string
          lang: string
          updated_at: string | null
          value: string | null
          value_json: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          key: string
          lang?: string
          updated_at?: string | null
          value?: string | null
          value_json?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          key?: string
          lang?: string
          updated_at?: string | null
          value?: string | null
          value_json?: Json | null
        }
        Relationships: []
      }
      company_billing_info: {
        Row: {
          address: string
          bank_account: string | null
          bank_name: string | null
          city: string
          company_name: string
          contact_email: string
          contact_phone: string | null
          country: string
          created_at: string
          id: string
          postal_code: string
          tax_number: string
          updated_at: string
        }
        Insert: {
          address: string
          bank_account?: string | null
          bank_name?: string | null
          city: string
          company_name: string
          contact_email: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          id?: string
          postal_code: string
          tax_number: string
          updated_at?: string
        }
        Update: {
          address?: string
          bank_account?: string | null
          bank_name?: string | null
          city?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          id?: string
          postal_code?: string
          tax_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          is_subscribed: boolean | null
          name: string | null
          source: string | null
          tags: string[] | null
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          is_subscribed?: boolean | null
          name?: string | null
          source?: string | null
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          is_subscribed?: boolean | null
          name?: string | null
          source?: string | null
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      cta_clicks: {
        Row: {
          clicked_at: string
          cta_text: string
          cta_type: string | null
          id: string
          ip_address: string | null
          page_path: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          cta_text: string
          cta_type?: string | null
          id?: string
          ip_address?: string | null
          page_path: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          cta_text?: string
          cta_type?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      digital_entitlements: {
        Row: {
          created_at: string | null
          download_count: number | null
          expires_at: string
          id: string
          max_downloads: number | null
          order_id: string
          product_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          expires_at?: string
          id?: string
          max_downloads?: number | null
          order_id: string
          product_id: string
          token?: string
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          expires_at?: string
          id?: string
          max_downloads?: number | null
          order_id?: string
          product_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_entitlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_entitlements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          campaign_id: string | null
          created_at: string
          filename: string
          id: string
          message_id: string | null
          message_type: string
          mime_type: string
          size: number
          storage_path: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          filename: string
          id?: string
          message_id?: string | null
          message_type: string
          mime_type: string
          size: number
          storage_path: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          filename?: string
          id?: string
          message_id?: string | null
          message_type?: string
          mime_type?: string
          size?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          filters: Json | null
          id: string
          name: string
          scheduled_for: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          id?: string
          name: string
          scheduled_for?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          id?: string
          name?: string
          scheduled_for?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          body_html: string
          body_text: string | null
          contact_id: string
          created_at: string
          direction: string | null
          error_message: string | null
          id: string
          in_reply_to_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          contact_id: string
          created_at?: string
          direction?: string | null
          error_message?: string | null
          id?: string
          in_reply_to_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          contact_id?: string
          created_at?: string
          direction?: string | null
          error_message?: string | null
          id?: string
          in_reply_to_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_in_reply_to_id_fkey"
            columns: ["in_reply_to_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_en: string
          answer_es: string
          answer_hu: string
          created_at: string
          display_order: number
          id: string
          question_en: string
          question_es: string
          question_hu: string
          updated_at: string
        }
        Insert: {
          answer_en: string
          answer_es: string
          answer_hu: string
          created_at?: string
          display_order?: number
          id?: string
          question_en: string
          question_es: string
          question_hu: string
          updated_at?: string
        }
        Update: {
          answer_en?: string
          answer_es?: string
          answer_hu?: string
          created_at?: string
          display_order?: number
          id?: string
          question_en?: string
          question_es?: string
          question_hu?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_links: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description_en: string | null
          description_es: string | null
          description_hu: string | null
          id: string
          is_active: boolean | null
          is_youtube: boolean | null
          sort_order: number | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at: string | null
          url: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          description_hu?: string | null
          id?: string
          is_active?: boolean | null
          is_youtube?: boolean | null
          sort_order?: number | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at?: string | null
          url: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description_en?: string | null
          description_es?: string | null
          description_hu?: string | null
          id?: string
          is_active?: boolean | null
          is_youtube?: boolean | null
          sort_order?: number | null
          title_en?: string
          title_es?: string
          title_hu?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      form_interactions: {
        Row: {
          abandoned: boolean | null
          completed_at: string | null
          fields_filled: Json | null
          form_type: string
          id: string
          session_id: string | null
          started_at: string
          time_spent: number | null
        }
        Insert: {
          abandoned?: boolean | null
          completed_at?: string | null
          fields_filled?: Json | null
          form_type: string
          id?: string
          session_id?: string | null
          started_at?: string
          time_spent?: number | null
        }
        Update: {
          abandoned?: boolean | null
          completed_at?: string | null
          fields_filled?: Json | null
          form_type?: string
          id?: string
          session_id?: string | null
          started_at?: string
          time_spent?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          id: string
          invoice_number: string
          issued_at: string
          service_name: string
          service_price: number
          tax_rate: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_email: string
          customer_name: string
          id?: string
          invoice_number: string
          issued_at?: string
          service_name: string
          service_price: number
          tax_rate?: number
          total_amount: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          service_name?: string
          service_price?: number
          tax_rate?: number
          total_amount?: number
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          form_interactions: number | null
          id: string
          last_updated: string
          lead_id: string | null
          page_views_count: number | null
          return_visits: number | null
          score: number | null
          session_id: string | null
          time_on_site: number | null
        }
        Insert: {
          form_interactions?: number | null
          id?: string
          last_updated?: string
          lead_id?: string | null
          page_views_count?: number | null
          return_visits?: number | null
          score?: number | null
          session_id?: string | null
          time_on_site?: number | null
        }
        Update: {
          form_interactions?: number | null
          id?: string
          last_updated?: string
          lead_id?: string | null
          page_views_count?: number | null
          return_visits?: number | null
          score?: number | null
          session_id?: string | null
          time_on_site?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          gdpr_consent: boolean
          headcount: number | null
          id: string
          interest_type: string
          marketing_optin: boolean
          message: string | null
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          gdpr_consent?: boolean
          headcount?: number | null
          id?: string
          interest_type: string
          marketing_optin?: boolean
          message?: string | null
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gdpr_consent?: boolean
          headcount?: number | null
          id?: string
          interest_type?: string
          marketing_optin?: boolean
          message?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_type: Database["public"]["Enums"]["product_type"]
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["product_type"]
          line_total: number
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["product_type"]
          line_total?: number
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_name: string | null
          billing_postal_code: string | null
          billing_same_as_shipping: boolean | null
          box_point_id: string | null
          box_point_label: string | null
          box_provider: string | null
          created_at: string | null
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          shipping_postal_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_same_as_shipping?: boolean | null
          box_point_id?: string | null
          box_point_label?: string | null
          box_provider?: string | null
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_same_as_shipping?: boolean | null
          box_point_id?: string | null
          box_point_label?: string | null
          box_provider?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          shipping_postal_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_exit_page: boolean | null
          page_path: string
          referrer: string | null
          scroll_depth: number | null
          session_id: string | null
          time_on_page: number | null
          user_agent: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_exit_page?: boolean | null
          page_path: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_exit_page?: boolean | null
          page_path?: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      process_steps: {
        Row: {
          created_at: string | null
          description_en: string
          description_es: string
          description_hu: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_en: string
          description_es: string
          description_hu: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string
          description_es?: string
          description_hu?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_en?: string
          title_es?: string
          title_hu?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          currency: string
          description_en: string
          description_es: string
          description_hu: string
          excerpt_en: string | null
          excerpt_es: string | null
          excerpt_hu: string | null
          file_asset_url: string | null
          gallery_images: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_on_sale: boolean | null
          price_gross: number
          product_type: Database["public"]["Enums"]["product_type"]
          sale_from: string | null
          sale_price: number | null
          sale_to: string | null
          sort_order: number | null
          subtitle_en: string | null
          subtitle_es: string | null
          subtitle_hu: string | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string
          description_en: string
          description_es: string
          description_hu: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_hu?: string | null
          file_asset_url?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
          price_gross: number
          product_type?: Database["public"]["Enums"]["product_type"]
          sale_from?: string | null
          sale_price?: number | null
          sale_to?: string | null
          sort_order?: number | null
          subtitle_en?: string | null
          subtitle_es?: string | null
          subtitle_hu?: string | null
          title_en: string
          title_es: string
          title_hu: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string
          description_en?: string
          description_es?: string
          description_hu?: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_hu?: string | null
          file_asset_url?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
          price_gross?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          sale_from?: string | null
          sale_price?: number | null
          sale_to?: string | null
          sort_order?: number | null
          subtitle_en?: string | null
          subtitle_es?: string | null
          subtitle_hu?: string | null
          title_en?: string
          title_es?: string
          title_hu?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          featured: boolean
          id: string
          image_url: string | null
          is_on_sale: boolean
          name: string
          price: number
          sale_price: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_on_sale?: boolean
          name: string
          price: number
          sale_price?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_on_sale?: boolean
          name?: string
          price?: number
          sale_price?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_metrics: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          first_visit: string
          id: string
          is_returning_visitor: boolean | null
          last_activity: string
          page_count: number | null
          session_id: string
          total_duration: number | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_visit?: string
          id?: string
          is_returning_visitor?: boolean | null
          last_activity?: string
          page_count?: number | null
          session_id: string
          total_duration?: number | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_visit?: string
          id?: string
          is_returning_visitor?: boolean | null
          last_activity?: string
          page_count?: number | null
          session_id?: string
          total_duration?: number | null
        }
        Relationships: []
      }
      shipping_config: {
        Row: {
          base_fee: number
          box_fee: number | null
          created_at: string | null
          currency: string
          free_shipping_threshold: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          base_fee?: number
          box_fee?: number | null
          created_at?: string | null
          currency?: string
          free_shipping_threshold?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          base_fee?: number
          box_fee?: number | null
          created_at?: string | null
          currency?: string
          free_shipping_threshold?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      szamlazz_settings: {
        Row: {
          agent_key: string
          created_at: string
          currency: string | null
          enabled: boolean | null
          id: string
          invoice_prefix: string | null
          language: string | null
          password: string
          payment_method: string | null
          updated_at: string
          username: string
        }
        Insert: {
          agent_key: string
          created_at?: string
          currency?: string | null
          enabled?: boolean | null
          id?: string
          invoice_prefix?: string | null
          language?: string | null
          password: string
          payment_method?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          agent_key?: string
          created_at?: string
          currency?: string | null
          enabled?: boolean | null
          id?: string
          invoice_prefix?: string | null
          language?: string | null
          password?: string
          payment_method?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_booking_slots: {
        Args: { p_service_id?: string }
        Returns: {
          duration_minutes: number
          scheduled_date: string
          scheduled_time: string
          service_id: string
        }[]
      }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_admin_user: { Args: never; Returns: undefined }
      setup_admin_user_by_email: {
        Args: { _email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status: "NEW" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
      product_type: "DIGITAL" | "PHYSICAL"
      shipping_method: "HOME" | "BOX" | "NONE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      order_status: ["NEW", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"],
      payment_status: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      product_type: ["DIGITAL", "PHYSICAL"],
      shipping_method: ["HOME", "BOX", "NONE"],
    },
  },
} as const
