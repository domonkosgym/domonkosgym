-- Create featured_links table for managing external links/appearances
CREATE TABLE public.featured_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_hu TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_hu TEXT,
  description_en TEXT,
  description_es TEXT,
  url TEXT NOT NULL,
  cover_image_url TEXT,
  is_youtube BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.featured_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active featured links"
ON public.featured_links
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage featured links"
ON public.featured_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_featured_links_updated_at
BEFORE UPDATE ON public.featured_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default data
INSERT INTO public.featured_links (title_hu, title_en, title_es, description_hu, description_en, description_es, url, is_youtube, sort_order) VALUES
('YouTube csatorna', 'YouTube Channel', 'Canal de YouTube', 'Edzésvideók és fitness tartalmak', 'Workout videos and fitness content', 'Videos de entrenamiento y contenido fitness', 'https://www.youtube.com/channel/UCnhuGHSG9A98jpbNkDVgJTA', true, 1),
('Profi Edzők', 'Pro Trainers', 'Entrenadores Profesionales', 'Szakmai megjelenés a Profi Edzők oldalon', 'Professional appearance on Pro Trainers', 'Aparición profesional en Entrenadores Profesionales', 'https://www.profiedzok.hu', false, 2),
('Fitness World Magazine', 'Fitness World Magazine', 'Revista Fitness World', 'Cikk a Fitness World Magazine-ban', 'Article in Fitness World Magazine', 'Artículo en la Revista Fitness World', 'https://www.fitnessworldmagazine.hu', false, 3),
('Perfect Diet', 'Perfect Diet', 'Dieta Perfecta', 'Táplálkozási tanácsok és megjelenés', 'Nutrition advice and appearance', 'Consejos de nutrición y aparición', 'https://www.perfectdiet.hu', false, 4);