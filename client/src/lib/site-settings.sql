-- =============================================================
-- App-VIP — Tabla site_settings para configuración del sitio
-- =============================================================
-- Ejecutar este SQL en el SQL Editor del dashboard de Supabase:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================================

-- 1. Crear la tabla site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 2. Insertar la fila inicial (si no existe)
INSERT INTO site_settings (id, logo_url) 
VALUES (1, NULL) 
ON CONFLICT (id) DO NOTHING;

-- 3. Activar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Lectura: Pública (todos necesitan ver el logo)
CREATE POLICY "site_settings_select_public"
  ON site_settings FOR SELECT
  USING (true);

-- Update: Solo administradores
CREATE POLICY "site_settings_update_admin"
  ON site_settings FOR UPDATE
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

-- Insert: Solo administradores (para el upsert)
CREATE POLICY "site_settings_insert_admin"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================
-- ✅ SCRIPT COMPLETADO
-- La tabla site_settings está lista para usar.
-- El admin panel puede guardar el logo_url aquí.
-- =============================================================
