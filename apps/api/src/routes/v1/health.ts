import type { FastifyInstance } from "fastify";

import { checkDatabaseConnection } from "../../db/client.js";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    const dbOk = await checkDatabaseConnection();
    const status = dbOk ? "ok" : "degraded";
    return reply.status(dbOk ? 200 : 503).send({ status, db: dbOk ? "ok" : "unavailable" });
  });
}
