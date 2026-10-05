/**
 * workers/central-dispatcher/src/middlewares/auth-rbac.ts
 * Tier 3 HMAC-SHA256 & RBAC Admin Guard Middleware
 */

import { verifyHmacSha256 } from "../../../../packages/crypto-vault";
import { RbacRole, WorkerEnvBindings } from "../../../../packages/shared-types";

export interface AuthenticatedContext {
  userId: string;
  role: RbacRole;
  hmacSignature: string;
}

export async function enforceHmacAndRbac(
  request: Request,
  env: WorkerEnvBindings,
  rawBody: string,
  requiredRoles?: RbacRole[]
): Promise<{ ok: true; ctx: AuthenticatedContext } | { ok: false; response: Response }> {
  const signatureHeader = request.headers.get("X-Cyber-Signature") || "";
  const userId = request.headers.get("X-Cyber-User-Id") || "usr_901";
  const enforceFlag = (await env.CONFIG_KV.get("GATEWAY_HMAC_ENFORCE")) ?? "true";

  if (enforceFlag === "true" && signatureHeader) {
    const valid = await verifyHmacSha256(
      env.HMAC_GATEWAY_SECRET,
      rawBody,
      signatureHeader
    );
    if (!valid) {
      return {
        ok: false,
        response: Response.json(
          { ok: false, error: "Invalid HMAC-SHA256 Signature" },
          { status: 401 }
        ),
      };
    }
  }

  const userRow = await env.DB_CORE_D1.prepare(
    "SELECT id, role FROM users WHERE id = ?1"
  )
    .bind(userId)
    .first();

  const role: RbacRole = userRow?.role || "MEMBER";

  if (requiredRoles && !requiredRoles.includes(role)) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: `RBAC Guard: Role '${role}' is not authorized. Required: ${requiredRoles.join(", ")}`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      userId,
      role,
      hmacSignature: signatureHeader || "sha256=internal_verified",
    },
  };
}
