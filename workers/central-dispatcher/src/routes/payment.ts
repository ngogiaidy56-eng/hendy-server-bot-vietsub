/**
 * workers/central-dispatcher/src/routes/payment.ts
 * Tier 4 VietQR Auto Payment Engine Webhook IPN Handler
 */

import { WorkerEnvBindings } from "../../../../packages/shared-types";

export async function handleVietQrWebhook(
  payload: Record<string, unknown>,
  env: WorkerEnvBindings
): Promise<Response> {
  const userId = String(payload.userId || "usr_901");
  const amountVnd = Number(payload.amountVnd || 0);
  const bankCode = String(payload.bankCode || "MBBank");
  const referenceCode = String(
    payload.referenceCode || `CYBER_${Date.now()}`
  );

  if (amountVnd <= 0) {
    return Response.json({ ok: false, error: "Invalid top-up amount" }, { status: 400 });
  }

  const txnId = `txn_vqr_${Date.now()}`;

  await env.DB_CORE_D1.batch([
    env.DB_CORE_D1.prepare(
      "UPDATE users SET balance_vnd = balance_vnd + ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2"
    ).bind(amountVnd, userId),
    env.DB_CORE_D1.prepare(
      `INSERT INTO transactions (id, user_id, type, route, amount_vnd, bank_code, reference_code, status)
       VALUES (?1, ?2, 'VIETQR_TOPUP', 'nap_tien', ?3, ?4, ?5, 'Completed')`
    ).bind(txnId, userId, amountVnd, bankCode, referenceCode),
  ]);

  return Response.json({
    ok: true,
    transactionId: txnId,
    referenceCode,
    creditedAmountVnd: amountVnd,
  });
}
