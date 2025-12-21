CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'NEW',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


--
-- Name: product_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_type AS ENUM (
    'DIGITAL',
    'PHYSICAL'
);


--
-- Name: shipping_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shipping_method AS ENUM (
    'HOME',
    'BOX',
    'NONE'
);


--
-- Name: get_booking_slots(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_booking_slots(p_service_id uuid DEFAULT NULL::uuid) RETURNS TABLE(service_id uuid, scheduled_date date, scheduled_time time without time zone, duration_minutes integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    b.service_id,
    b.scheduled_date,
    b.scheduled_time,
    b.duration_minutes
  FROM public.bookings b
  WHERE b.status IN ('pending', 'confirmed')
    AND (p_service_id IS NULL OR b.service_id = p_service_id);
$$;


--
-- Name: get_user_id_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_id_by_email(_email text) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select id from auth.users where lower(email) = lower(_email) limit 1;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: setup_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_admin_user() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'domonkosgym@admin.local';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;


--
-- Name: setup_admin_user_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_admin_user_by_email(_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id from auth.users where lower(email) = lower(_email);
  if admin_user_id is not null then
    insert into public.user_roles (user_id, role)
    values (admin_user_id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;
end;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT availability_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


--
-- Name: blocked_time_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_time_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocked_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    reason text,
    all_day boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    billing_address text,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    paid boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reschedule_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text])))
);


--
-- Name: cms_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    lang text DEFAULT 'hu'::text NOT NULL,
    value text,
    value_json jsonb,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: company_billing_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_billing_info (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    tax_number text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'Magyarország'::text NOT NULL,
    bank_name text,
    bank_account text,
    contact_email text NOT NULL,
    contact_phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_subscribed boolean DEFAULT true,
    unsubscribed_at timestamp with time zone,
    source text DEFAULT 'manual'::text,
    tags text[] DEFAULT '{}'::text[],
    country text,
    unsubscribe_token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL
);


--
-- Name: cta_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cta_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    page_path text NOT NULL,
    cta_text text NOT NULL,
    cta_type text,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    user_agent text,
    ip_address text
);


--
-- Name: digital_entitlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digital_entitlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '72:00:00'::interval) NOT NULL,
    download_count integer DEFAULT 0,
    max_downloads integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_type text NOT NULL,
    campaign_id uuid,
    message_id uuid,
    storage_path text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_attachments_message_type_check CHECK ((message_type = ANY (ARRAY['campaign'::text, 'single'::text])))
);


--
-- Name: email_campaign_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_campaign_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pending'::text,
    sent_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    error_message text,
    CONSTRAINT email_campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'bounced'::text, 'opened'::text, 'clicked'::text, 'unsubscribed'::text, 'failed'::text])))
);


--
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    status text DEFAULT 'draft'::text,
    scheduled_for timestamp with time zone,
    filters jsonb,
    CONSTRAINT email_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'failed'::text])))
);


--
-- Name: email_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    direction text DEFAULT 'outgoing'::text,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    in_reply_to_id uuid,
    error_message text,
    CONSTRAINT email_messages_direction_check CHECK ((direction = ANY (ARRAY['outgoing'::text, 'incoming'::text]))),
    CONSTRAINT email_messages_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sending'::text, 'sent'::text, 'failed'::text])))
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    question_hu text NOT NULL,
    answer_hu text NOT NULL,
    question_en text NOT NULL,
    answer_en text NOT NULL,
    question_es text NOT NULL,
    answer_es text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: form_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    form_type text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    abandoned boolean DEFAULT false,
    fields_filled jsonb,
    time_spent integer
);

ALTER TABLE ONLY public.form_interactions REPLICA IDENTITY FULL;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_address text,
    service_name text NOT NULL,
    service_price numeric(10,2) NOT NULL,
    currency text DEFAULT 'HUF'::text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 27.00 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    session_id text,
    score integer DEFAULT 0,
    page_views_count integer DEFAULT 0,
    time_on_site integer DEFAULT 0,
    return_visits integer DEFAULT 0,
    form_interactions integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    headcount integer,
    interest_type text NOT NULL,
    message text,
    gdpr_consent boolean DEFAULT false NOT NULL,
    marketing_optin boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY public.leads REPLICA IDENTITY FULL;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric NOT NULL,
    line_total numeric NOT NULL,
    item_type public.product_type NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status public.order_status DEFAULT 'NEW'::public.order_status NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    total_amount numeric NOT NULL,
    shipping_amount numeric DEFAULT 0,
    currency text DEFAULT 'HUF'::text NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    shipping_method public.shipping_method DEFAULT 'NONE'::public.shipping_method NOT NULL,
    shipping_country text,
    shipping_postal_code text,
    shipping_city text,
    shipping_address text,
    box_provider text,
    box_point_id text,
    box_point_label text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    page_path text NOT NULL,
    referrer text,
    user_agent text,
    session_id text,
    ip_address text,
    scroll_depth integer DEFAULT 0,
    time_on_page integer DEFAULT 0,
    is_exit_page boolean DEFAULT false,
    viewport_width integer,
    viewport_height integer
);

ALTER TABLE ONLY public.page_views REPLICA IDENTITY FULL;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_hu text NOT NULL,
    title_en text NOT NULL,
    title_es text NOT NULL,
    subtitle_hu text,
    subtitle_en text,
    subtitle_es text,
    description_hu text NOT NULL,
    description_en text NOT NULL,
    description_es text NOT NULL,
    excerpt_hu text,
    excerpt_en text,
    excerpt_es text,
    product_type public.product_type DEFAULT 'DIGITAL'::public.product_type NOT NULL,
    price_gross numeric NOT NULL,
    currency text DEFAULT 'HUF'::text NOT NULL,
    cover_image_url text,
    gallery_images text[] DEFAULT '{}'::text[],
    file_asset_url text,
    is_featured boolean DEFAULT false,
    is_on_sale boolean DEFAULT false,
    sale_price numeric,
    sale_from timestamp with time zone,
    sale_to timestamp with time zone,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price numeric NOT NULL,
    category text NOT NULL,
    image_url text,
    featured boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    first_visit timestamp with time zone DEFAULT now() NOT NULL,
    last_activity timestamp with time zone DEFAULT now() NOT NULL,
    total_duration integer DEFAULT 0,
    page_count integer DEFAULT 1,
    is_returning_visitor boolean DEFAULT false,
    device_type text,
    country text,
    city text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipping_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipping_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base_fee numeric DEFAULT 0 NOT NULL,
    box_fee numeric DEFAULT 0,
    currency text DEFAULT 'HUF'::text NOT NULL,
    free_shipping_threshold numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: szamlazz_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.szamlazz_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agent_key text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    invoice_prefix text DEFAULT 'INV'::text,
    payment_method text DEFAULT 'cash'::text,
    currency text DEFAULT 'HUF'::text,
    language text DEFAULT 'hu'::text,
    enabled boolean DEFAULT false
);


--
-- Name: theme_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_pkey PRIMARY KEY (id);


--
-- Name: blocked_time_slots blocked_time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_time_slots
    ADD CONSTRAINT blocked_time_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cms_settings cms_settings_key_lang_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_settings
    ADD CONSTRAINT cms_settings_key_lang_key UNIQUE (key, lang);


--
-- Name: cms_settings cms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_settings
    ADD CONSTRAINT cms_settings_pkey PRIMARY KEY (id);


--
-- Name: company_billing_info company_billing_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_billing_info
    ADD CONSTRAINT company_billing_info_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_email_key UNIQUE (email);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_unsubscribe_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_unsubscribe_token_key UNIQUE (unsubscribe_token);


--
-- Name: cta_clicks cta_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cta_clicks
    ADD CONSTRAINT cta_clicks_pkey PRIMARY KEY (id);


--
-- Name: digital_entitlements digital_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_entitlements
    ADD CONSTRAINT digital_entitlements_pkey PRIMARY KEY (id);


--
-- Name: digital_entitlements digital_entitlements_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_entitlements
    ADD CONSTRAINT digital_entitlements_token_key UNIQUE (token);


--
-- Name: email_attachments email_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_attachments
    ADD CONSTRAINT email_attachments_pkey PRIMARY KEY (id);


--
-- Name: email_campaign_recipients email_campaign_recipients_campaign_id_contact_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaign_recipients
    ADD CONSTRAINT email_campaign_recipients_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id);


--
-- Name: email_campaign_recipients email_campaign_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaign_recipients
    ADD CONSTRAINT email_campaign_recipients_pkey PRIMARY KEY (id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);


--
-- Name: email_messages email_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: form_interactions form_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_interactions
    ADD CONSTRAINT form_interactions_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lead_scores lead_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);


--
-- Name: session_metrics session_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_metrics
    ADD CONSTRAINT session_metrics_pkey PRIMARY KEY (id);


--
-- Name: shipping_config shipping_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_config
    ADD CONSTRAINT shipping_config_pkey PRIMARY KEY (id);


--
-- Name: szamlazz_settings szamlazz_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.szamlazz_settings
    ADD CONSTRAINT szamlazz_settings_pkey PRIMARY KEY (id);


--
-- Name: theme_settings theme_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_settings
    ADD CONSTRAINT theme_settings_key_key UNIQUE (key);


--
-- Name: theme_settings theme_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_settings
    ADD CONSTRAINT theme_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_availability_slots_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_slots_day ON public.availability_slots USING btree (day_of_week);


--
-- Name: idx_blocked_time_slots_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_time_slots_date ON public.blocked_time_slots USING btree (blocked_date);


--
-- Name: idx_bookings_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_scheduled_date ON public.bookings USING btree (scheduled_date);


--
-- Name: idx_bookings_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_service_id ON public.bookings USING btree (service_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_campaign_recipients_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_recipients_campaign ON public.email_campaign_recipients USING btree (campaign_id);


--
-- Name: idx_campaign_recipients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaign_recipients_status ON public.email_campaign_recipients USING btree (status);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);


--
-- Name: idx_contacts_subscribed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_subscribed ON public.contacts USING btree (is_subscribed);


--
-- Name: idx_contacts_unsubscribe_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_unsubscribe_token ON public.contacts USING btree (unsubscribe_token);


--
-- Name: idx_cta_clicks_clicked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cta_clicks_clicked_at ON public.cta_clicks USING btree (clicked_at);


--
-- Name: idx_cta_clicks_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cta_clicks_page_path ON public.cta_clicks USING btree (page_path);


--
-- Name: idx_email_attachments_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_attachments_campaign ON public.email_attachments USING btree (campaign_id);


--
-- Name: idx_email_attachments_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_attachments_message ON public.email_attachments USING btree (message_id);


--
-- Name: idx_email_messages_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_messages_contact ON public.email_messages USING btree (contact_id);


--
-- Name: idx_faqs_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faqs_display_order ON public.faqs USING btree (display_order);


--
-- Name: idx_form_interactions_form_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_interactions_form_type ON public.form_interactions USING btree (form_type);


--
-- Name: idx_lead_scores_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_lead_id ON public.lead_scores USING btree (lead_id);


--
-- Name: idx_lead_scores_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_scores_score ON public.lead_scores USING btree (score DESC);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_page_views_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_created_at ON public.page_views USING btree (created_at DESC);


--
-- Name: idx_page_views_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_page_path ON public.page_views USING btree (page_path);


--
-- Name: idx_session_metrics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_metrics_created_at ON public.session_metrics USING btree (created_at);


--
-- Name: idx_session_metrics_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_metrics_session_id ON public.session_metrics USING btree (session_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: blocked_time_slots update_blocked_time_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blocked_time_slots_updated_at BEFORE UPDATE ON public.blocked_time_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_settings update_cms_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_settings_updated_at BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: company_billing_info update_company_billing_info_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_company_billing_info_updated_at BEFORE UPDATE ON public.company_billing_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: faqs update_faqs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shipping_config update_shipping_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shipping_config_updated_at BEFORE UPDATE ON public.shipping_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: szamlazz_settings update_szamlazz_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_szamlazz_settings_updated_at BEFORE UPDATE ON public.szamlazz_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: theme_settings update_theme_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON public.theme_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blocked_time_slots blocked_time_slots_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_time_slots
    ADD CONSTRAINT blocked_time_slots_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: digital_entitlements digital_entitlements_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_entitlements
    ADD CONSTRAINT digital_entitlements_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: digital_entitlements digital_entitlements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_entitlements
    ADD CONSTRAINT digital_entitlements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: email_attachments email_attachments_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_attachments
    ADD CONSTRAINT email_attachments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE CASCADE;


--
-- Name: email_attachments email_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_attachments
    ADD CONSTRAINT email_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.email_messages(id) ON DELETE CASCADE;


--
-- Name: email_campaign_recipients email_campaign_recipients_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaign_recipients
    ADD CONSTRAINT email_campaign_recipients_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE CASCADE;


--
-- Name: email_campaign_recipients email_campaign_recipients_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaign_recipients
    ADD CONSTRAINT email_campaign_recipients_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: email_messages email_messages_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: email_messages email_messages_in_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_in_reply_to_id_fkey FOREIGN KEY (in_reply_to_id) REFERENCES public.email_messages(id);


--
-- Name: lead_scores lead_scores_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scores
    ADD CONSTRAINT lead_scores_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: faqs Admins can delete FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete FAQs" ON public.faqs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can delete bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: services Admins can delete services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete services" ON public.services FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: faqs Admins can insert FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert FAQs" ON public.faqs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: company_billing_info Admins can insert company billing info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert company billing info" ON public.company_billing_info FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: services Admins can insert services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert services" ON public.services FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: szamlazz_settings Admins can insert szamlazz settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert szamlazz settings" ON public.szamlazz_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cms_settings Admins can manage CMS settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage CMS settings" ON public.cms_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_attachments Admins can manage attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage attachments" ON public.email_attachments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: availability_slots Admins can manage availability slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage availability slots" ON public.availability_slots USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_time_slots Admins can manage blocked slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage blocked slots" ON public.blocked_time_slots USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: email_campaign_recipients Admins can manage campaign recipients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage campaign recipients" ON public.email_campaign_recipients USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_campaigns Admins can manage campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage campaigns" ON public.email_campaigns USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contacts Admins can manage contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage contacts" ON public.contacts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: digital_entitlements Admins can manage entitlements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage entitlements" ON public.digital_entitlements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_messages Admins can manage messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage messages" ON public.email_messages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage products" ON public.products USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shipping_config Admins can manage shipping config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage shipping config" ON public.shipping_config USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: theme_settings Admins can manage theme settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage theme settings" ON public.theme_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: faqs Admins can update FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update FAQs" ON public.faqs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can update bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: company_billing_info Admins can update company billing info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update company billing info" ON public.company_billing_info FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: services Admins can update services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update services" ON public.services FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: szamlazz_settings Admins can update szamlazz settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update szamlazz settings" ON public.szamlazz_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cta_clicks Admins can view CTA clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view CTA clicks" ON public.cta_clicks FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can view all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can view all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: company_billing_info Admins can view company billing info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view company billing info" ON public.company_billing_info FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: form_interactions Admins can view form interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view form interactions" ON public.form_interactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_scores Admins can view lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead scores" ON public.lead_scores FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_items Admins can view order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_views Admins can view page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: session_metrics Admins can view session metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view session metrics" ON public.session_metrics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: szamlazz_settings Admins can view szamlazz settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view szamlazz settings" ON public.szamlazz_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: digital_entitlements Anyone can create entitlements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create entitlements" ON public.digital_entitlements FOR INSERT WITH CHECK (true);


--
-- Name: order_items Anyone can create order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);


--
-- Name: orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: cta_clicks Anyone can insert CTA clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert CTA clicks" ON public.cta_clicks FOR INSERT WITH CHECK (true);


--
-- Name: bookings Anyone can insert bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);


--
-- Name: form_interactions Anyone can insert form interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert form interactions" ON public.form_interactions FOR INSERT WITH CHECK (true);


--
-- Name: invoices Anyone can insert invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);


--
-- Name: lead_scores Anyone can insert lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert lead scores" ON public.lead_scores FOR INSERT WITH CHECK (true);


--
-- Name: leads Anyone can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);


--
-- Name: page_views Anyone can insert page views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);


--
-- Name: session_metrics Anyone can insert session metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert session metrics" ON public.session_metrics FOR INSERT WITH CHECK (true);


--
-- Name: form_interactions Anyone can update form interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update form interactions" ON public.form_interactions FOR UPDATE USING (true);


--
-- Name: lead_scores Anyone can update lead scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update lead scores" ON public.lead_scores FOR UPDATE USING (true);


--
-- Name: session_metrics Anyone can update session metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update session metrics" ON public.session_metrics FOR UPDATE USING (true);


--
-- Name: products Anyone can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: services Anyone can view active services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING ((active = true));


--
-- Name: availability_slots Anyone can view availability slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view availability slots" ON public.availability_slots FOR SELECT USING (true);


--
-- Name: blocked_time_slots Anyone can view blocked slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view blocked slots" ON public.blocked_time_slots FOR SELECT USING (true);


--
-- Name: cms_settings Anyone can view published CMS settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published CMS settings" ON public.cms_settings FOR SELECT USING ((is_published = true));


--
-- Name: shipping_config Anyone can view shipping config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shipping config" ON public.shipping_config FOR SELECT USING (true);


--
-- Name: theme_settings Anyone can view theme settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view theme settings" ON public.theme_settings FOR SELECT USING (true);


--
-- Name: faqs Public can read FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read FAQs" ON public.faqs FOR SELECT USING (true);


--
-- Name: digital_entitlements Token holders can view their entitlements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Token holders can view their entitlements" ON public.digital_entitlements FOR SELECT USING (true);


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: bookings Users can view their own bookings by email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own bookings by email" ON public.bookings FOR SELECT USING (
CASE
    WHEN (auth.uid() IS NULL) THEN false
    ELSE (customer_email = (( SELECT users.email
       FROM auth.users
      WHERE (users.id = auth.uid())))::text)
END);


--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_time_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: company_billing_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_billing_info ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: cta_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: digital_entitlements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.digital_entitlements ENABLE ROW LEVEL SECURITY;

--
-- Name: email_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: email_campaign_recipients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

--
-- Name: email_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: email_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

--
-- Name: form_interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: session_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: shipping_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shipping_config ENABLE ROW LEVEL SECURITY;

--
-- Name: szamlazz_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.szamlazz_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: theme_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;