-- SQL Migration: Add view_count column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
