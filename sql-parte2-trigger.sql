-- =============================================
-- PARTE 2: Trigger + Función RPC
-- Pegar en Supabase SQL Editor y ejecutar
-- DESPUÉS de haber ejecutado la Parte 1
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email,
    'user'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$func$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_download(app_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  UPDATE applications
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = app_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.increment_download(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_download(UUID) TO authenticated;
