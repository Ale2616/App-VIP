-- =========================================================================
-- MIGRACIÓN DE BASE DE DATOS: COLUMNAS DE MEMBRESÍA EN PROFILES
-- Pegar y ejecutar en el SQL Editor de Supabase
-- =========================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS membership_type TEXT,
  ADD COLUMN IF NOT EXISTS membership_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMPTZ;
