import postgres from "postgres";

const sql = postgres({
  host: "db.wzeklbcmloxxvzqtxocq.supabase.co",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "!s.z8GeYDHa%Q9i",
  ssl: "require",
});

async function setup() {
  console.log("🚀 Conectando a Supabase PostgreSQL...");
  console.log("");

  // Test connection
  try {
    const result = await sql`SELECT current_database() as db, current_user as usr`;
    console.log(`   ✅ Conectado: DB=${result[0].db}, User=${result[0].usr}`);
  } catch (e) {
    console.error("❌ Error de conexión:", e.message);
    process.exit(1);
  }

  // ─── 1. Tabla profiles ────────────────────────────────────
  console.log("");
  console.log("📋 Creando tabla: profiles...");
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'Usuario',
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("   ✅ profiles creada");

  // ─── 2. Tabla activity_logs ───────────────────────────────
  console.log("📋 Creando tabla: activity_logs...");
  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("   ✅ activity_logs creada");

  // ─── 3. Tabla apps ────────────────────────────────────────
  console.log("📋 Creando tabla: apps...");
  await sql`
    CREATE TABLE IF NOT EXISTS apps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      version TEXT DEFAULT '1.0.0',
      icon_url TEXT,
      image_url TEXT,
      download_url TEXT,
      file_path TEXT,
      file_size BIGINT DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'aplicaciones',
      download_count INT NOT NULL DEFAULT 0,
      uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("   ✅ apps creada");

  // ─── 4. RLS ───────────────────────────────────────────────
  console.log("");
  console.log("🔒 Activando Row Level Security...");
  await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE apps ENABLE ROW LEVEL SECURITY`;
  console.log("   ✅ RLS activado en las 3 tablas");

  // ─── 5. Policies ──────────────────────────────────────────
  console.log("");
  console.log("📜 Creando políticas de seguridad...");

  // Drop existing policies to avoid conflicts
  const policyMap = [
    { name: "Profiles are viewable by everyone", table: "profiles" },
    { name: "Users can update own profile", table: "profiles" },
    { name: "Users can view own activity logs", table: "activity_logs" },
    { name: "Users can insert own activity logs", table: "activity_logs" },
    { name: "Apps are viewable by everyone", table: "apps" },
    { name: "Authenticated users can create apps", table: "apps" },
    { name: "Admins can update apps", table: "apps" },
    { name: "Admins can delete apps", table: "apps" },
  ];

  for (const p of policyMap) {
    try {
      await sql.unsafe(`DROP POLICY IF EXISTS "${p.name}" ON ${p.table}`);
    } catch { /* ignore */ }
  }

  await sql`CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true)`;
  await sql`CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)`;
  await sql`CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id)`;
  await sql`CREATE POLICY "Users can insert own activity logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id)`;
  await sql`CREATE POLICY "Apps are viewable by everyone" ON apps FOR SELECT USING (true)`;
  await sql`CREATE POLICY "Authenticated users can create apps" ON apps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)`;
  await sql.unsafe(`CREATE POLICY "Admins can update apps" ON apps FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))`);
  await sql.unsafe(`CREATE POLICY "Admins can delete apps" ON apps FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))`);
  console.log("   ✅ 8 políticas creadas");

  // ─── 6. Trigger ───────────────────────────────────────────
  console.log("");
  console.log("⚡ Creando trigger para auto-crear perfiles...");
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, email, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
        NEW.email,
        'user'
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
  `);
  await sql.unsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
  await sql.unsafe(`CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`);
  console.log("   ✅ Trigger handle_new_user creado");

  // ─── 7. Storage bucket ────────────────────────────────────
  console.log("");
  console.log("📦 Creando bucket de storage 'app-files'...");
  try {
    await sql`INSERT INTO storage.buckets (id, name, public) VALUES ('app-files', 'app-files', true) ON CONFLICT (id) DO NOTHING`;
    console.log("   ✅ Bucket 'app-files' creado (público)");
  } catch (e) {
    console.log("   ⚠️  No se pudo crear bucket automáticamente:", e.message);
    console.log("   → Créalo manualmente: Dashboard → Storage → New Bucket → 'app-files' → Public");
  }

  // ─── Done ─────────────────────────────────────────────────
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("✅ ¡BASE DE DATOS CONFIGURADA EXITOSAMENTE!");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("Tablas creadas:    profiles, activity_logs, apps");
  console.log("RLS activado:      ✅");
  console.log("Políticas:         8 políticas de seguridad");
  console.log("Trigger:           handle_new_user (auto-create profile)");
  console.log("Storage:           bucket 'app-files'");
  console.log("");
  console.log("Próximo paso:");
  console.log("  cd client && npm run dev");

  await sql.end();
}

setup().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
