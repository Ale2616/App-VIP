-- =============================================================
-- App-VIP — Columna mod (TEXT) en la tabla applications
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/wzeklbcmloxxvzqtxocq/sql
-- =============================================================

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS mod TEXT;

-- ✅ SCRIPT COMPLETADO
