-- Create process_steps table for "How it works" section
CREATE TABLE public.process_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_hu TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_hu TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Star',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active process steps"
ON public.process_steps
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage process steps"
ON public.process_steps
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_process_steps_updated_at
BEFORE UPDATE ON public.process_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default process steps
INSERT INTO public.process_steps (title_hu, title_en, title_es, description_hu, description_en, description_es, icon_name, sort_order) VALUES
('1. Ingyenes konzultáció', '1. Free consultation', '1. Consulta gratuita', 'Beszéljük át a céljaidat és a helyzetedből – tisztán, gyorsan.', 'Let''s discuss your goals and situation – clearly and quickly.', 'Hablemos sobre tus objetivos y situación, de manera clara y rápida.', 'MessageCircle', 0),
('2. Személyre szabott terv', '2. Personalized plan', '2. Plan personalizado', 'Kapsz egy étrendet és edzéstervet, amit valóban be tudsz illeszteni az életedbe.', 'You''ll get a diet and workout plan that actually fits into your life.', 'Recibirás una dieta y un plan de entrenamiento que realmente encaja en tu vida.', 'ClipboardList', 1),
('3. Követés és finomítás', '3. Follow-up and refinement', '3. Seguimiento y refinamiento', 'Nem maradsz magadra – szükség szerint frissítjük a tervet, amíg nem működik.', 'You won''t be left alone – we''ll update the plan as needed until it works.', 'No te quedarás solo: actualizaremos el plan según sea necesario hasta que funcione.', 'TrendingUp', 2);