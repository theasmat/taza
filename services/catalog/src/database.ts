import pg from "pg";
import { config } from "./config";

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool as pg };

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log("Database connection established");

    // Tables are already created via migration
    // This just verifies connection
    await client.query("SELECT NOW()");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await pool.end();
});

process.on("SIGINT", async () => {
  await pool.end();
});
