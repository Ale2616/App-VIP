-- SQL Migration: Setup Roles and Row Level Security (RLS) Policies
-- 1. Actualizar la restricción de rol en la tabla profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('SUPER_ADMIN', 'EDITOR', 'VIP_PREMIUM', 'VIP_ESTANDAR', 'FREE_USER'));

-- 2. Cambiar el valor por defecto del rol a 'FREE_USER'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'FREE_USER';

-- 3. Actualizar los usuarios existentes a los nuevos roles
UPDATE profiles SET role = 'SUPER_ADMIN' WHERE role = 'admin' OR role = 'SUPER_ADMIN';
UPDATE profiles SET role = 'FREE_USER' WHERE role = 'user' OR role = 'FREE_USER' OR role IS NULL;
UPDATE profiles SET role = 'VIP_PREMIUM' WHERE role = 'elite' OR role = 'VIP_PREMIUM';
UPDATE profiles SET role = 'VIP_ESTANDAR' WHERE role = 'vip' OR role = 'VIP_ESTANDAR';

-- 4. Modificar la función trigger de registro automático para que asigne 'FREE_USER' por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email,
    'FREE_USER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Configurar RLS en la tabla PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Cualquier persona autenticada puede ver los perfiles básicos
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Los usuarios pueden editar sus propios datos (excluyendo el rol)
CREATE POLICY "Users can update own profile data" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Evitar que cambien su propio rol a menos que ya sean SUPER_ADMIN
      role = (SELECT role FROM profiles WHERE id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
      )
    )
  );

-- Solo SUPER_ADMIN puede hacer cambios libres o gestionar roles
CREATE POLICY "Super admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );


-- 6. Configurar RLS en la tabla APPLICATIONS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apps are viewable by everyone" ON applications;
DROP POLICY IF EXISTS "Authenticated users can create apps" ON applications;
DROP POLICY IF EXISTS "Admins can update apps" ON applications;
DROP POLICY IF EXISTS "Admins can delete apps" ON applications;
DROP POLICY IF EXISTS "Super admins and editors can insert applications" ON applications;
DROP POLICY IF EXISTS "Super admins and editors can update applications" ON applications;
DROP POLICY IF EXISTS "Super admins and editors can delete applications" ON applications;

-- Lectura pública para todos
CREATE POLICY "Apps are viewable by everyone" ON applications
  FOR SELECT USING (true);

-- Solo SUPER_ADMIN y EDITOR pueden insertar, actualizar y borrar aplicaciones
CREATE POLICY "Super admins and editors can insert applications" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "Super admins and editors can update applications" ON applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "Super admins and editors can delete applications" ON applications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );


-- 7. Configurar RLS en la tabla APP_REQUESTS
ALTER TABLE app_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts to app_requests" ON app_requests;
DROP POLICY IF EXISTS "Super admins and editors can view requests" ON app_requests;
DROP POLICY IF EXISTS "Super admins and editors can manage requests" ON app_requests;

-- Cualquier persona (incluso anónima) puede enviar solicitudes
CREATE POLICY "Allow anonymous inserts to app_requests" ON app_requests
  FOR INSERT WITH CHECK (true);

-- Solo SUPER_ADMIN y EDITOR pueden ver o gestionar solicitudes
CREATE POLICY "Super admins and editors can view requests" ON app_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "Super admins and editors can manage requests" ON app_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'EDITOR')
    )
  );


-- 8. Configurar RLS en la tabla SUBSCRIPTION_PLANS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow admin to modify subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Only super admins can modify plans" ON subscription_plans;

-- Lectura pública para todos
CREATE POLICY "Allow anyone to read subscription_plans" ON subscription_plans
  FOR SELECT USING (true);

-- Solo SUPER_ADMIN puede insertar, actualizar o eliminar planes
CREATE POLICY "Only super admins can modify plans" ON subscription_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );


-- 9. Configurar RLS en la tabla SITE_SETTINGS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_public" ON site_settings;
DROP POLICY IF EXISTS "site_settings_update_admin" ON site_settings;
DROP POLICY IF EXISTS "site_settings_insert_admin" ON site_settings;
DROP POLICY IF EXISTS "Only super admins can modify settings" ON site_settings;

-- Lectura pública para todos
CREATE POLICY "site_settings_select_public" ON site_settings
  FOR SELECT USING (true);

-- Solo SUPER_ADMIN puede modificar la configuración del sitio
CREATE POLICY "Only super admins can modify settings" ON site_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );
