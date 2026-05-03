-- =============================================================
-- App-VIP — SCRIPT DE SEGURIDAD DEFINITIVO
-- =============================================================
-- INSTRUCCIONES:
-- 1. Ve a tu dashboard de Supabase
-- 2. Abre SQL Editor (menú izquierdo)
-- 3. Pega TODO este script
-- 4. Haz clic en "Run" (ejecutar)
-- 5. Debe terminar sin errores
-- =============================================================
-- Última actualización: 2026-05-03
-- =============================================================


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 1: LIMPIEZA TOTAL DE POLÍTICAS ANTERIORES
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ─── Tabla: profiles ────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- ─── Tabla: applications ───────────────────────────────────
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

-- ─── Tabla: apps (si existe) ────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apps') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Apps are viewable by everyone" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create apps" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update apps" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete apps" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert apps" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "apps_select_public" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "apps_insert_admin" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "apps_update_admin" ON apps';
    EXECUTE 'DROP POLICY IF EXISTS "apps_delete_admin" ON apps';
  END IF;
END $$;

-- ─── Tabla: activity_logs (si existe) ──────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "activity_logs_select_own" ON activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "activity_logs_insert_own" ON activity_logs';
  END IF;
END $$;

-- ─── Trigger anterior ──────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 2: ASEGURAR QUE LA TABLA profiles EXISTE
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Usuario',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 3: ACTIVAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Activar en 'apps' solo si existe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apps') THEN
    EXECUTE 'ALTER TABLE apps ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Activar en 'activity_logs' solo si existe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    EXECUTE 'ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 4: POLÍTICAS RLS — TABLA profiles
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- Cualquiera puede ver los perfiles (necesario para verificar roles)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Solo el dueño puede editar su propio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir INSERT desde el trigger (SECURITY DEFINER se encarga)
-- También permitir que el usuario inserte su propio perfil como fallback
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 5: POLÍTICAS RLS — TABLA applications (PRINCIPAL)
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ✅ LECTURA: Pública para TODOS (incluso sin cuenta)
CREATE POLICY "applications_select_public"
  ON applications FOR SELECT
  USING (true);

-- 🔒 INSERT: SOLO administradores
CREATE POLICY "applications_insert_admin"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 🔒 UPDATE: SOLO administradores
CREATE POLICY "applications_update_admin"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 🔒 DELETE: SOLO administradores
CREATE POLICY "applications_delete_admin"
  ON applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 6: POLÍTICAS RLS — TABLA apps (SI EXISTE)
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apps') THEN

    EXECUTE 'CREATE POLICY "apps_select_public" ON apps FOR SELECT USING (true)';

    EXECUTE 'CREATE POLICY "apps_insert_admin" ON apps FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    )';

    EXECUTE 'CREATE POLICY "apps_update_admin" ON apps FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    )';

    EXECUTE 'CREATE POLICY "apps_delete_admin" ON apps FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    )';

  END IF;
END $$;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 7: POLÍTICAS RLS — TABLA activity_logs (SI EXISTE)
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN

    EXECUTE 'CREATE POLICY "activity_logs_select_own" ON activity_logs FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "activity_logs_insert_own" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id)';

  END IF;
END $$;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 8: TRIGGER — Auto-crear perfil al registrarse
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- Función que se ejecuta automáticamente cuando alguien se registra
-- SECURITY DEFINER = se ejecuta con permisos de superusuario
-- (necesario para insertar en profiles saltando RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email,
    'user'  -- ← Siempre asigna rol 'user' por defecto
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el perfil ya existe (registro duplicado), no hacer nada
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear el trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- PASO 9: FUNCIÓN RPC — Incrementar contador de descargas
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- Esta función permite que CUALQUIER visitante (incluso sin cuenta)
-- pueda incrementar el contador de descargas.
-- Se ejecuta con SECURITY DEFINER para saltarse las restricciones RLS.

CREATE OR REPLACE FUNCTION public.increment_download(app_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE applications
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permitir que cualquiera pueda llamar esta función
GRANT EXECUTE ON FUNCTION public.increment_download(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_download(UUID) TO authenticated;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- ✅ SCRIPT COMPLETADO EXITOSAMENTE
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
--
-- RESUMEN DE SEGURIDAD:
-- ┌─────────────────┬──────────┬────────────────┬────────────────┬────────────────┐
-- │ Tabla           │ SELECT   │ INSERT         │ UPDATE         │ DELETE         │
-- ├─────────────────┼──────────┼────────────────┼────────────────┼────────────────┤
-- │ profiles        │ Público  │ Propio usuario │ Propio usuario │ —              │
-- │ applications    │ Público  │ Solo Admin     │ Solo Admin     │ Solo Admin     │
-- │ apps            │ Público  │ Solo Admin     │ Solo Admin     │ Solo Admin     │
-- │ activity_logs   │ Propio   │ Propio usuario │ —              │ —              │
-- └─────────────────┴──────────┴────────────────┴────────────────┴────────────────┘
--
-- TRIGGER: Cada nuevo usuario → rol 'user' automáticamente
-- RPC: increment_download() → Público (cualquiera puede usarla)
-- =============================================================
