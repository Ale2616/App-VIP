-- SQL Migration: Create increment_view_count RPC function
CREATE OR REPLACE FUNCTION increment_view_count(app_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE applications
  SET view_count = view_count + 1
  WHERE id = app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
