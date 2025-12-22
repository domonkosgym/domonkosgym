-- Create landing_page_sections table for managing landing page sections
CREATE TABLE public.landing_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title_hu TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  title_es TEXT NOT NULL DEFAULT '',
  subtitle_hu TEXT,
  subtitle_en TEXT,
  subtitle_es TEXT,
  content_hu TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  content_es TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage landing page sections"
  ON public.landing_page_sections
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active landing page sections"
  ON public.landing_page_sections
  FOR SELECT
  USING (is_active = true);

-- Insert default sections matching the current landing page structure
INSERT INTO public.landing_page_sections (section_key, title_hu, title_en, title_es, is_active, sort_order) VALUES
  ('hero', 'Hero szekció', 'Hero Section', 'Sección Hero', true, 1),
  ('books', 'Könyvek', 'Books', 'Libros', true, 2),
  ('train_hard', 'Szlogen', 'Slogan', 'Eslogan', true, 3),
  ('featured_in', 'Megjelenések', 'Featured In', 'Apariciones', true, 4),
  ('bio', 'Bemutatkozás', 'About', 'Sobre mí', true, 5),
  ('process', 'Hogyan működik', 'How It Works', 'Cómo funciona', true, 6),
  ('b2b', 'B2B szekció', 'B2B Section', 'Sección B2B', true, 7),
  ('faq', 'GYIK', 'FAQ', 'Preguntas frecuentes', true, 8),
  ('contact', 'Kapcsolat', 'Contact', 'Contacto', true, 9);