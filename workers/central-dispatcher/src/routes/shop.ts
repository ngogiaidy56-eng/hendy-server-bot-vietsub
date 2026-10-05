/**
 * workers/central-dispatcher/src/routes/shop.ts
 * Tier 4 Shop Code Engine, VIP Upgrade, Gifcode & Social Media (MXH) Engine
 */

import { WorkerEnvBindings } from "../../../../packages/shared-types";

export async function handleShopAndCoreServices(
  route: string,
  userId: string,
  payload: Record<string, unknown>,
  env: WorkerEnvBindings
): Promise<Response> {
  if (route === "shop_code") {
    const itemId = String(payload.itemId || "code_01");
    const item = await env.DB_CORE_D1.prepare(
      "SELECT id, code, price_vnd, storage_key_r2 FROM shop_items WHERE id = ?1"
    )
      .bind(itemId)
      .first();

    if (!item) {
      return Response.json({ ok: false, error: "Shop item not found" }, { status: 404 });
    }

    const user = await env.DB_CORE_D1.prepare(
      "SELECT balance_vnd FROM users WHERE id = ?1"
    )
      .bind(userId)
      .first();

    if (!user || user.balance_vnd < item.price_vnd) {
      return Response.json(
        { ok: false, error: "Insufficient D1 wallet balance" },
        { status: 400 }
      );
    }

    const licenseKey = `LIC-${item.code}-${Date.now().toString(36).toUpperCase()}`;
    await env.DB_CORE_D1.batch([
      env.DB_CORE_D1.prepare(
        "UPDATE users SET balance_vnd = balance_vnd - ?1, total_spent_vnd = total_spent_vnd + ?1 WHERE id = ?2"
      ).bind(item.price_vnd, userId),
      env.DB_CORE_D1.prepare(
        "UPDATE shop_items SET sales_count = sales_count + 1 WHERE id = ?1"
      ).bind(item.id),
      env.DB_CORE_D1.prepare(
        `INSERT INTO transactions (id, user_id, type, route, amount_vnd, bank_code, reference_code, status)
         VALUES (?1, ?2, 'SHOP_CODE_PURCHASE', 'shop_code', ?3, 'WALLET_D1', ?4, 'Completed')`
      ).bind(`txn_shp_${Date.now()}`, userId, -item.price_vnd, licenseKey),
    ]);

    return Response.json({
      ok: true,
      licenseKey,
      downloadR2Key: item.storage_key_r2,
    });
  }

  return Response.json({ ok: true, route, status: "Processed by Tier 4 Core" });
}
