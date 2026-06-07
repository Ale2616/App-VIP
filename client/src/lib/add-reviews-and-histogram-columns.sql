-- SQL Migration: Add reviews and ratings_histogram columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviews JSONB;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ratings_histogram JSONB;
