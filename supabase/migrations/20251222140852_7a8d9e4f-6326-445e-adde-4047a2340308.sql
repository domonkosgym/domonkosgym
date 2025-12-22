-- Create about_sections table for multiple sections on the About page
CREATE TABLE public.about_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title_hu text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  title_es text NOT NULL DEFAULT '',
  content_hu text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  content_es text NOT NULL DEFAULT '',
  image_urls text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage about sections" ON public.about_sections
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active about sections" ON public.about_sections
  FOR SELECT USING (is_active = true);

-- Create site_images table for Hero, Process section, and other site images
CREATE TABLE public.site_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_key text NOT NULL UNIQUE,
  label_hu text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  image_url text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage site images" ON public.site_images
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view site images" ON public.site_images
  FOR SELECT USING (true);

-- Insert default about sections
INSERT INTO public.about_sections (section_key, title_hu, title_en, title_es, content_hu, content_en, content_es, sort_order) VALUES
  ('intro', 'Rólam', 'About Me', 'Sobre Mí', 'Bemutatkozó szöveg ide kerül...', 'Introduction text goes here...', 'El texto de introducción va aquí...', 1),
  ('history', 'Múltam', 'My History', 'Mi Historia', 'Honnan indultam és hogyan jutottam el idáig...', 'Where I started and how I got here...', 'De dónde vengo y cómo llegué aquí...', 2),
  ('achievements', 'Eredményeim', 'Achievements', 'Logros', 'Eddigi eredményeim és sikertörténeteim...', 'My achievements and success stories...', 'Mis logros e historias de éxito...', 3),
  ('why_me', 'Miért érdemes velem dolgoznod?', 'Why Work With Me?', '¿Por qué trabajar conmigo?', 'Egyedi megközelítésem és előnyeim...', 'My unique approach and advantages...', 'Mi enfoque único y ventajas...', 4);

-- Insert default site images
INSERT INTO public.site_images (image_key, label_hu, label_en, description) VALUES
  ('hero_main', 'Hero főkép', 'Hero Main Image', 'A főoldal hero szekciójának háttérképe'),
  ('process_section', 'Hogyan működik kép', 'How It Works Image', 'A folyamat szekció képe'),
  ('bio_section', 'Bio szekció kép', 'Bio Section Image', 'A bemutatkozó szekció képe a főoldalon');