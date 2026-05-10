-- =============================================================
-- App-VIP — Columna download_options (JSONB) en applications
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

-- Agregar columna download_options si no existe
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS download_options JSONB DEFAULT '[]'::jsonb;

-- Ejemplo de cómo se almacena:
-- [
--   { "title": "Premium Mod", "version": "v2.1", "size": "105 MB", "url": "https://..." },
--   { "title": "Versión Lite", "version": "v1.0", "size": "45 MB",  "url": "https://..." }
-- ]

-- ✅ SCRIPT COMPLETADO
