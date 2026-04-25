-- =============================================================
-- App-VIP — Supabase Database Schema
-- =============================================================
-- Ejecutar este SQL en el SQL Editor del dashboard de Supabase:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================================

-- 1. Tabla de Perfiles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Usuario',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Logs de Actividad
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Apps Subidas
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  version TEXT DEFAULT '1.0.0',
  icon_url TEXT,
  image_url TEXT,
  download_url TEXT,
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'aplicaciones',
  download_count INT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Profiles: todos pueden ver, solo el dueño puede editar
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Activity Logs: cada usuario ve solo los suyos
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apps: todos pueden ver, autenticados pueden crear, admins editan/eliminan
CREATE POLICY "Apps are viewable by everyone"
  ON apps FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create apps"
  ON apps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update apps"
  ON apps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete apps"
  ON apps FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================
-- Trigger: crear perfil automáticamente al registrarse
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Eliminar trigger si existe para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- Storage: crear bucket 'app-files' desde el panel de Supabase
-- Dashboard → Storage → New Bucket → Name: app-files → Public: true
-- =============================================================
