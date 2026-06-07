-- SQL Migration: Add content_rating column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS content_rating TEXT;
