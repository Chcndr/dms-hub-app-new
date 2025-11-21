import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function clean() {
  console.log("🧹 Cleaning database...");

  try {
    // Disable foreign key checks (Postgres)
    await db.execute(sql`SET session_replication_role = 'replica'`);

    // Truncate all tables (order doesn't matter with FK checks disabled)
    const tables = [
      "system_logs",
      "audit_logs",
      "ecocredits",
      "carbon_footprint",
      "product_tracking",
      "products",
      "civic_reports",
      "reimbursements",
      "fund_transactions",
      "carbon_credits_config",
      "checkins",
      "transactions",
      "shops",
      "markets",
      "extended_users",
      "users"
    ];

    for (const table of tables) {
      console.log(`Truncating ${table}...`);
      await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
    }

    // Re-enable foreign key checks (Postgres)
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log("✅ Database cleaned successfully!");
  } catch (e) {
    console.error("❌ Clean failed:", e);
    process.exit(1);
  }
}

clean()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
