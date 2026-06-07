-- =========================================================================
-- MÓDULO DE SEGURIDAD, ROLES (RBAC) Y POLÍTICAS RLS PARA SUPABASE
-- Pegar y ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. Migración y normalización de roles legacy
-- Primero eliminamos la restricción check anterior para poder actualizar los roles
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Migración de roles antiguos a la nueva estructura de roles
UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE role = 'admin';
UPDATE public.profiles SET role = 'VIP_PREMIUM' WHERE role = 'elite';
UPDATE public.profiles SET role = 'VIP_ESTANDAR' WHERE role = 'vip';
UPDATE public.profiles SET role = 'FREE_USER' WHERE role = 'user' OR role IS NULL;

-- 2. Asegurar la tabla profiles con la nueva estructura de check constraint
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('SUPER_ADMIN', 'EDITOR', 'VIP_PREMIUM', 'VIP_ESTANDAR', 'FREE_USER'));

-- 3. Habilitar RLS en todas las tablas clave
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Limpieza previa de políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

DROP POLICY IF EXISTS "applications_select_public" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_update_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_modify_admin_editor" ON public.applications;

DROP POLICY IF EXISTS "plans_select_public" ON public.subscription_plans;
DROP POLICY IF EXISTS "plans_modify_super_admin" ON public.subscription_plans;

DROP POLICY IF EXISTS "settings_select_public" ON public.site_settings;
DROP POLICY IF EXISTS "settings_modify_super_admin" ON public.site_settings;

DROP POLICY IF EXISTS "logs_select_own" ON public.activity_logs;
DROP POLICY IF EXISTS "logs_insert_own" ON public.activity_logs;

-- 5. Creación de políticas RLS detalladas y blindadas

-- ─── TABLA: profiles ──────────────────────────────────────────────────────
-- Lectura pública para perfiles
CREATE POLICY "profiles_select_public" ON public.profiles 
  FOR SELECT USING (true);

-- Permitir a usuarios editar sus campos básicos de perfil, pero NUNCA cambiar su propio rol
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Mantiene el rol existente del usuario
  );

-- SUPER_ADMIN tiene acceso absoluto de edición de perfiles y cambio de roles
CREATE POLICY "profiles_update_super_admin" ON public.profiles 
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
  WITH CHECK (true);

-- Permitir a nuevos usuarios registrar su perfil (usualmente a través del trigger de registro)
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ─── TABLA: applications ──────────────────────────────────────────────────
-- Cualquier rol puede ver la lista de aplicaciones
CREATE POLICY "applications_select_public" ON public.applications 
  FOR SELECT USING (true);

-- SUPER_ADMIN y EDITOR pueden Crear, Modificar y Borrar aplicaciones
CREATE POLICY "applications_modify_admin_editor" ON public.applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

-- ─── TABLA: subscription_plans ────────────────────────────────────────────
-- Cualquiera puede consultar los planes de membresía
CREATE POLICY "plans_select_public" ON public.subscription_plans 
  FOR SELECT USING (true);

-- Solo el SUPER_ADMIN puede alterar planes de membresía y precios
CREATE POLICY "plans_modify_super_admin" ON public.subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ─── TABLA: site_settings ─────────────────────────────────────────────────
-- Cualquiera puede leer la configuración del sitio (como el logo dinámico)
CREATE POLICY "settings_select_public" ON public.site_settings 
  FOR SELECT USING (true);

-- Solo el SUPER_ADMIN puede editar y actualizar la configuración global del servidor
CREATE POLICY "settings_modify_super_admin" ON public.site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ─── TABLA: activity_logs ─────────────────────────────────────────────────
CREATE POLICY "logs_select_own" ON public.activity_logs 
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "logs_insert_own" ON public.activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── TABLA: app_requests (Opcional) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  app_name TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_rule" ON public.app_requests;
DROP POLICY IF EXISTS "requests_insert_rule" ON public.app_requests;
DROP POLICY IF EXISTS "requests_update_rule" ON public.app_requests;

CREATE POLICY "requests_select_rule" ON public.app_requests 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "requests_insert_rule" ON public.app_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "requests_update_rule" ON public.app_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

-- 6. Trigger y Función RPC para nuevo usuario registrado
-- La función asignará por defecto el rol de 'FREE_USER' a todo usuario nuevo
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
    'FREE_USER'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$func$;

-- Re-instanciamos el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
