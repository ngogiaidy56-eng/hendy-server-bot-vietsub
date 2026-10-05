-- 0001_initial_schema.sql
-- Cloudflare D1 SQLite Schema: Users, Wallets, VIP Levels, Transactions, Shop Code & Vietsub Queue

CREATE TABLE IF NOT EXISTS vip_levels (
  tier_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  discount_percent REAL NOT NULL DEFAULT 0,
  max_video_resolution TEXT NOT NULL DEFAULT '1080p',
  r2_retention_days INTEGER NOT NULL DEFAULT 30,
  annual_price_vnd INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER', -- SUPER_ADMIN | EDITOR_PRO | MEMBER
  vip_tier TEXT NOT NULL DEFAULT 'STANDARD',
  balance_vnd INTEGER NOT NULL DEFAULT 0,
  total_spent_vnd INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vip_tier) REFERENCES vip_levels(tier_code)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- VIETQR_TOPUP | SHOP_CODE_PURCHASE | VIP_UPGRADE | GIFCODE_REWARD | MXH_SERVICE_ORDER
  route TEXT NOT NULL,
  amount_vnd INTEGER NOT NULL,
  bank_code TEXT NOT NULL,
  reference_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_vnd INTEGER NOT NULL,
  sales_count INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL,
  storage_key_r2 TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vietsub_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'ja-JP',
  target_lang TEXT NOT NULL DEFAULT 'vi-VN',
  stt_engine TEXT NOT NULL DEFAULT 'Whisper-Large-v3',
  translate_engine TEXT NOT NULL DEFAULT 'GPT-4o',
  render_mode TEXT NOT NULL DEFAULT 'WASM_SUBTITLES_OCTOPUS',
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Queued',
  r2_output_key TEXT,
  ass_file_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
