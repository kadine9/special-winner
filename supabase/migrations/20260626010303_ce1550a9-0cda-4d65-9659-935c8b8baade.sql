CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.segments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segments TO authenticated;
GRANT ALL ON public.segments TO service_role;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert segments" ON public.segments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view segments" ON public.segments FOR SELECT TO anon, authenticated USING (true);