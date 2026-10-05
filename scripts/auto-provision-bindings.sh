#!/usr/bin/env bash
set -euo pipefail

echo "[Tier 2 Auto-Provision] Starting Cloudflare D1, KV, and R2 resource check..."

DB_NAME="hendy_vietsub_d1"
R2_BUCKET="hendy-vietsub-media-r2"
KV_NAMESPACES=("CONFIG_KV" "API_KEYS_KV" "SESSION_KV")

if ! npx wrangler d1 list | grep -q "$DB_NAME"; then
  echo "Creating D1 Database: $DB_NAME"
  npx wrangler d1 create "$DB_NAME"
else
  echo "D1 Database '$DB_NAME' already provisioned."
fi

echo "Applying D1 migrations from database/d1-migrations..."
npx wrangler d1 migrations apply "$DB_NAME" --remote || true

for NS in "${KV_NAMESPACES[@]}"; do
  if ! npx wrangler kv namespace list | grep -q "$NS"; then
    echo "Creating KV Namespace: $NS"
    npx wrangler kv namespace create "$NS"
  else
    echo "KV Namespace '$NS' already provisioned."
  fi
done

if ! npx wrangler r2 bucket list | grep -q "$R2_BUCKET"; then
  echo "Creating R2 Bucket: $R2_BUCKET"
  npx wrangler r2 bucket create "$R2_BUCKET"
else
  echo "R2 Bucket '$R2_BUCKET' already provisioned."
fi

echo "[Tier 2 Auto-Provision] All D1, KV, and R2 bindings verified successfully."
