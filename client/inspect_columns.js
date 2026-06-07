import postgres from "postgres";

async function main() {
  const hosts = [
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-east-2.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-us-west-2.pooler.supabase.com"
  ];
  const ports = [5432, 6543];

  for (const host of hosts) {
    for (const port of ports) {
      console.log(`Testing ${host}:${port}...`);
      try {
        const sql = postgres({
          host,
          port,
          database: "postgres",
          username: "postgres.wzeklbcmloxxvzqtxocq",
          password: "!s.z8GeYDHa%Q9i",
          ssl: "require",
          connect_timeout: 4
        });
        const result = await sql`SELECT 1 as connected`;
        console.log(`✅ SUCCESS: Connected to ${host}:${port}!`);
        await sql.end();
        return;
      } catch (err) {
        console.log(`❌ FAILED ${host}:${port}: ${err.message}`);
      }
    }
  }
}

main().catch(console.error);
