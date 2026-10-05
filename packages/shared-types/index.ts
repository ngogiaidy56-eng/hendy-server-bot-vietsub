/**
 * packages/shared-types/index.ts
 * Shared TypeScript Interfaces across Admin Portal, WASM Studio, Mini App & Cloudflare Workers
 */

export type RbacRole = "SUPER_ADMIN" | "EDITOR_PRO" | "MEMBER";
export type VipTier = "STANDARD" | "VIP_SILVER" | "VIP_GOLD" | "VIP_DIAMOND";

export interface UserRecord {
  id: string;
  telegram_id: string;
  username: string;
  full_name: string;
  role: RbacRole;
  vip_tier: VipTier;
  balance_vnd: number;
  total_spent_vnd: number;
  status: "Active" | "Restricted";
  updated_at: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  type:
    | "VIETQR_TOPUP"
    | "SHOP_CODE_PURCHASE"
    | "VIP_UPGRADE"
    | "GIFCODE_REWARD"
    | "MXH_SERVICE_ORDER";
  route: string;
  amount_vnd: number;
  bank_code: string;
  reference_code: string;
  status: "Completed" | "Pending" | "Failed";
  created_at: string;
}

export interface VietsubSubtitleCue {
  id: string;
  start: string;
  end: string;
  startSec: number;
  endSec: number;
  speaker: string;
  originalText: string;
  vietsubText: string;
  style: "Default" | "CyberNeon" | "SignTop" | "KaraokeFX";
  effectTag: string;
}

export interface WorkerEnvBindings {
  DB_CORE_D1: any;
  CONFIG_KV: any;
  API_KEYS_KV: any;
  SESSION_KV: any;
  MEDIA_BUCKET_R2: any;
  HMAC_GATEWAY_SECRET: string;
  AES_VAULT_MASTER_KEY: string;
  VIETSUB_AI_BACKEND_URL: string;
}
