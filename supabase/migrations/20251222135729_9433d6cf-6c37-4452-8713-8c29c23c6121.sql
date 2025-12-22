-- Create about_page table for the "About me" page content
CREATE TABLE public.about_page (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_hu TEXT NOT NULL DEFAULT 'Rólam',
  title_en TEXT NOT NULL DEFAULT 'About Me',
  title_es TEXT NOT NULL DEFAULT 'Sobre Mí',
  subtitle_hu TEXT,
  subtitle_en TEXT,
  subtitle_es TEXT,
  content_hu TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  image_url TEXT,
  achievements TEXT[], -- Array of achievements/milestones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view about page"
ON public.about_page
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage about page"
ON public.about_page
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_about_page_updated_at
BEFORE UPDATE ON public.about_page
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.about_page (title_hu, title_en, title_es, subtitle_hu, subtitle_en, subtitle_es, content_hu, content_en, content_es) VALUES
('Rólam', 'About Me', 'Sobre Mí', 
'Táplálkozási és teljesítmény-coach', 'Nutrition and Performance Coach', 'Coach de Nutrición y Rendimiento',
'Domonkos Zsolt vagyok, táplálkozási és teljesítmény-coach. Segítek úgy összeállítani az étrendedet és az edzéstervedet, hogy illeszkedjen a napjaidhoz – bonyolítás nélkül.

Ha szükséges, a laboreredményeidet is átbeszéljük, és ezek alapján finomítunk. A célom, hogy 14 napon belül kézhez kapd a személyre szabott tervedet, és közben érthető, emberi kommunikációra számíthass.

Több mint 10 éves tapasztalattal rendelkezem a fitness és táplálkozás területén. Számtalan ügyfélnek segítettem elérni céljait, legyen szó súlycsökkentésről, izomépítésről vagy általános egészségjavításról.',
'I am Zsolt Domonkos, a nutrition and performance coach. I help you create a diet and training plan that fits into your daily life – without complications.

If necessary, we will review your lab results and refine accordingly. My goal is to deliver your personalized plan within 14 days, with clear and human communication throughout.

I have more than 10 years of experience in fitness and nutrition. I have helped countless clients achieve their goals, whether it is weight loss, muscle building, or general health improvement.',
'Soy Zsolt Domonkos, coach de nutrición y rendimiento. Te ayudo a crear una dieta y un plan de entrenamiento que se adapte a tu vida diaria, sin complicaciones.

Si es necesario, revisaremos tus resultados de laboratorio y ajustaremos en consecuencia. Mi objetivo es entregar tu plan personalizado en 14 días, con una comunicación clara y humana en todo momento.

Tengo más de 10 años de experiencia en fitness y nutrición. He ayudado a innumerables clientes a alcanzar sus objetivos, ya sea pérdida de peso, construcción muscular o mejora general de la salud.');