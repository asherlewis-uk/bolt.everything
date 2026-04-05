import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabaseConnection } from "./db/client.js";

const app = buildApp();

async function shutdown(signal: string) {
  app.log.info({ signal }, "Shutdown signal received — draining connections.");
  try {
    await app.close();
    await closeDatabaseConnection();
    app.log.info("Server shut down cleanly.");
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Error during shutdown.");
    process.exit(1);
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error, "Failed to start server.");
  process.exitCode = 1;
}
