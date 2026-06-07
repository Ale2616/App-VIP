-- SQL Migration: Create subscription_plans table and seed initial data
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  gradient TEXT NOT NULL,
  border_color TEXT NOT NULL,
  glow_color TEXT NOT NULL,
  icon_bg TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  features JSONB NOT NULL,
  cta TEXT NOT NULL,
  cta_style TEXT NOT NULL,
  popular BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anyone to read subscription_plans" ON subscription_plans;
DROP POLICY IF EXISTS "Allow admin to modify subscription_plans" ON subscription_plans;

-- Create policy to allow anyone to read
CREATE POLICY "Allow anyone to read subscription_plans" ON subscription_plans
  FOR SELECT USING (true);

-- Create policy to allow admin to modify
CREATE POLICY "Allow admin to modify subscription_plans" ON subscription_plans
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed initial plans
INSERT INTO subscription_plans (id, name, price, period, description, gradient, border_color, glow_color, icon_bg, icon_name, features, cta, cta_style, popular)
VALUES
('free', 'Gratis', '$0', 'para siempre', 'Acceso básico al catálogo de aplicaciones y juegos.', 'from-slate-600 to-slate-700', 'border-slate-700/50', 'shadow-slate-500/5', 'from-slate-500 to-slate-600', 'Download', '[{"text": "Catálogo completo de apps", "included": true}, {"text": "Descargas con publicidad", "included": true}, {"text": "Actualizaciones básicas", "included": true}, {"text": "Enlaces directos", "included": false}, {"text": "Mods exclusivos", "included": false}, {"text": "Juegos de PC", "included": false}, {"text": "Peticiones directas", "included": false}]'::jsonb, 'Plan Actual', 'bg-slate-700 text-slate-300 cursor-default', false),
('vip', 'VIP Premium', '$4.99', '/mes', 'Enlaces directos, cero publicidad y mods exclusivos.', 'from-purple-500 to-fuchsia-600', 'border-purple-500/40', 'shadow-purple-500/20', 'from-purple-500 to-fuchsia-500', 'Crown', '[{"text": "Todo del plan Gratis", "included": true}, {"text": "Enlaces directos sin publicidad", "included": true}, {"text": "Mods y APKs exclusivos", "included": true}, {"text": "Soporte prioritario", "included": true}, {"text": "Actualizaciones anticipadas", "included": true}, {"text": "Juegos de PC", "included": false}, {"text": "Peticiones directas", "included": false}]'::jsonb, 'Obtener VIP Premium', 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/25', true),
('elite', 'VIP Élite', '$9.99', '/mes', 'Acceso total: PC, peticiones y contenido ilimitado.', 'from-amber-500 to-orange-500', 'border-amber-500/40', 'shadow-amber-500/20', 'from-amber-500 to-orange-500', 'Rocket', '[{"text": "Todo del plan VIP Premium", "included": true}, {"text": "Juegos de PC completos", "included": true}, {"text": "Software de PC premium", "included": true}, {"text": "Peticiones directas al equipo", "included": true}, {"text": "Acceso beta a nuevas apps", "included": true}, {"text": "Badge Élite en tu perfil", "included": true}, {"text": "Canal privado exclusivo", "included": true}]'::jsonb, 'Obtener VIP Élite', 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  period = EXCLUDED.period,
  description = EXCLUDED.description,
  gradient = EXCLUDED.gradient,
  border_color = EXCLUDED.border_color,
  glow_color = EXCLUDED.glow_color,
  icon_bg = EXCLUDED.icon_bg,
  icon_name = EXCLUDED.icon_name,
  features = EXCLUDED.features,
  cta = EXCLUDED.cta,
  cta_style = EXCLUDED.cta_style,
  popular = EXCLUDED.popular;
