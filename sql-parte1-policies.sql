-- =============================================
-- PARTE 1: Limpiar + Crear Políticas RLS
-- Pegar en Supabase SQL Editor y ejecutar
-- =============================================

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

DROP POLICY IF EXISTS "Apps are viewable by everyone" ON applications;
DROP POLICY IF EXISTS "Authenticated users can create apps" ON applications;
DROP POLICY IF EXISTS "Admins can update apps" ON applications;
DROP POLICY IF EXISTS "Admins can delete apps" ON applications;
DROP POLICY IF EXISTS "Admins can insert apps" ON applications;
DROP POLICY IF EXISTS "applications_select_public" ON applications;
DROP POLICY IF EXISTS "applications_insert_admin" ON applications;
DROP POLICY IF EXISTS "applications_update_admin" ON applications;
DROP POLICY IF EXISTS "applications_delete_admin" ON applications;
DROP POLICY IF EXISTS "Enable read access for all users" ON applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON applications;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON applications;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON applications;
DROP POLICY IF EXISTS "Anyone can read applications" ON applications;
DROP POLICY IF EXISTS "Only admins can insert applications" ON applications;
DROP POLICY IF EXISTS "Only admins can update applications" ON applications;
DROP POLICY IF EXISTS "Only admins can delete applications" ON applications;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Usuario',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "applications_select_public"
  ON applications FOR SELECT USING (true);

CREATE POLICY "applications_insert_admin"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "applications_update_admin"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "applications_delete_admin"
  ON applications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
