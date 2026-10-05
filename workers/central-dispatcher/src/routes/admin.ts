/**
 * workers/central-dispatcher/src/routes/admin.ts
 * Handles Admin Portal L1 Commands: RBAC User/Wallet Adjustment & Hot-Reload KV
 */

import { encryptAes256Gcm } from "../../../../packages/crypto-vault";
import { WorkerEnvBindings } from "../../../../packages/shared-types";

export async function handleAdminRoutes(
  action: string,
  payload: Record<string, unknown>,
  env: WorkerEnvBindings
): Promise<Response> {
  if (action === "admin_adjust_user") {
    const { targetUserId, deltaBalance = 0, newRole, newVipTier } = payload;
    await env.DB_CORE_D1.prepare(
      `UPDATE users
       SET balance_vnd = balance_vnd + ?1,
           role = COALESCE(?2, role),
           vip_tier = COALESCE(?3, vip_tier),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`
    )
      .bind(Number(deltaBalance), newRole || null, newVipTier || null, String(targetUserId))
      .run();

    return Response.json({
      ok: true,
      message: `Updated user ${targetUserId} in D1`,
    });
  }

  if (action === "admin_hot_reload") {
    const key = String(payload.key || "").toUpperCase();
    const value = String(payload.value || "");
    await env.CONFIG_KV.put(key, value);
    return Response.json({
      ok: true,
      message: `Hot-reloaded ${key} = ${value} in CONFIG_KV`,
    });
  }

  if (action === "admin_rotate_key") {
    const keyName = String(payload.keyName || "");
    const rawSecret = String(payload.rawSecret || "");
    const encrypted = await encryptAes256Gcm(env.AES_VAULT_MASTER_KEY, rawSecret);
    await env.API_KEYS_KV.put(keyName, JSON.stringify(encrypted));
    return Response.json({
      ok: true,
      message: `Encrypted and saved ${keyName} into API_KEYS_KV`,
    });
  }

  return Response.json({ ok: false, error: "Unknown admin route" }, { status: 400 });
}
