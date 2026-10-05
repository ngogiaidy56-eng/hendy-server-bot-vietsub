/**
 * workers/central-dispatcher/src/index.ts
 * Cloudflare Worker Central Dispatcher (Tier 3 Edge Gateway Ingress)
 */

import { WorkerEnvBindings } from "../../../packages/shared-types";
import { enforceHmacAndRbac } from "./middlewares/auth-rbac";
import { handleAdminRoutes } from "./routes/admin";
import { handleVietsubRoute } from "./routes/vietsub";
import { handleVietQrWebhook } from "./routes/payment";
import { handleShopAndCoreServices } from "./routes/shop";

export default {
  async fetch(request: Request, env: WorkerEnvBindings): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        service: "hendy-central-dispatcher",
        timestamp: new Date().toISOString(),
      });
    }

    const rawBody = request.method === "POST" ? await request.text() : "{}";
    const parsedBody = rawBody ? JSON.parse(rawBody) : {};
    const route = String(parsedBody.route || url.pathname);

    const requiredRoles = route.startsWith("admin_")
      ? (["SUPER_ADMIN"] as const)
      : undefined;

    const authResult = await enforceHmacAndRbac(
      request,
      env,
      rawBody,
      requiredRoles ? [...requiredRoles] : undefined
    );

    if (!authResult.ok) {
      return authResult.response;
    }

    await env.SESSION_KV.put(
      `sess_${authResult.ctx.userId}`,
      JSON.stringify({
        userId: authResult.ctx.userId,
        role: authResult.ctx.role,
        activeRoute: route,
        updatedAt: new Date().toISOString(),
      }),
      { expirationTtl: 3600 }
    );

    if (route.startsWith("admin_")) {
      return handleAdminRoutes(route, parsedBody.payload || {}, env);
    }

    if (url.pathname.startsWith("/api/vietsub/")) {
      return handleVietsubRoute(url.pathname, parsedBody, env);
    }

    if (route === "nap_tien") {
      return handleVietQrWebhook(parsedBody.payload || {}, env);
    }

    return handleShopAndCoreServices(
      route,
      authResult.ctx.userId,
      parsedBody.payload || {},
      env
    );
  },
};
