/**
 * workers/central-dispatcher/src/middlewares/auto-bindings.ts
 * Dynamically loads & decrypts API keys from Cloudflare KV (API_KEYS_KV)
 */

import {
  decryptAes256Gcm,
  EncryptedVaultPayload,
} from "../../../../packages/crypto-vault";
import { WorkerEnvBindings } from "../../../../packages/shared-types";

export async function resolveDynamicApiKey(
  env: WorkerEnvBindings,
  keyName:
    | "TELEGRAM_BOT_TOKEN"
    | "OPENAI_API_KEY"
    | "VIETQR_WEBHOOK_SECRET"
    | "SOCIAL_MMO_API_KEY"
): Promise<string | null> {
  const rawKv = await env.API_KEYS_KV.get(keyName);
  if (!rawKv) return null;

  try {
    const parsed = JSON.parse(rawKv) as EncryptedVaultPayload;
    if (parsed.iv && parsed.cipherText) {
      return await decryptAes256Gcm(env.AES_VAULT_MASTER_KEY, parsed);
    }
    return rawKv;
  } catch {
    return rawKv;
  }
}
