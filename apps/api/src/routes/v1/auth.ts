import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AppServices } from "../../app.js";
import { env } from "../../config/env.js";
import { verifyAppleIdentityToken } from "../../lib/apple-auth.js";

const signInRequestSchema = z.object({
  identityToken: z.string().min(1),
});

export function registerAuthRoutes(app: FastifyInstance, services: AppServices) {
  /**
   * POST /v1/auth/apple
   * Exchange an Apple identity token for a session cookie.
   */
  app.post("/auth/apple", async (request, reply) => {
    const { identityToken } = signInRequestSchema.parse(request.body);

    const claims = await verifyAppleIdentityToken(identityToken);
    const user = await services.sessionService.findOrCreateUser(claims.sub);

    reply.setCookie(env.SESSION_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // 30-day session; rotate on activity in Phase 2.
      maxAge: 60 * 60 * 24 * 30,
      signed: true,
    });

    return reply.status(200).send({ userId: user.id });
  });

  /**
   * POST /v1/auth/sign-out
   * Clear the session cookie.
   */
  app.post("/auth/sign-out", async (_request, reply) => {
    reply.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
    return reply.status(200).send({ ok: true });
  });
}
