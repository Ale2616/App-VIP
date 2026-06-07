import postgres from "postgres";

const sql = postgres({
  host: "db.wzeklbcmloxxvzqtxocq.supabase.co",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "!s.z8GeYDHa%Q9i",
  ssl: "require",
});

async function main() {
  const result = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'applications'
  `;
  console.log("COLUMNS FOR applications:", result);
  await sql.end();
}

main().catch(console.error);
