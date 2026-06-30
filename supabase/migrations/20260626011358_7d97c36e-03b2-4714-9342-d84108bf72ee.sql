GRANT DELETE ON public.segments TO anon, authenticated;
CREATE POLICY "Anyone can delete segments" ON public.segments FOR DELETE TO anon, authenticated USING (true);