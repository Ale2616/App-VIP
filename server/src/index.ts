import app, { setupRoutes } from "@/app";
import { DB_NAME, PORT } from "@/config/env";
import { AppDataSource } from "@/database/data-source";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log(" Connected to:", DB_NAME);

    // Setup routes AFTER database is initialized
    setupRoutes();

    app.listen(PORT, () => {
      console.log(" http://localhost:" + PORT);
    });
  } catch (error) {
    console.error("Internal server error:", error);
  }
}

main();
