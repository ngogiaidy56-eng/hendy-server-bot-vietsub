#!/usr/bin/env bash
set -euo pipefail

echo "[Dual Build Matrix] 1/4 Building Shared Packages..."
npm --workspace=packages/shared-types run build --if-present
npm --workspace=packages/crypto-vault run build --if-present
npm --workspace=packages/vietsub-sdk run build --if-present

echo "[Dual Build Matrix] 2/4 Deploying Cloudflare Central Worker Dispatcher (Tier 3)..."
npx wrangler deploy --config workers/central-dispatcher/wrangler.jsonc

echo "[Dual Build Matrix] 3/4 Building Front-end Applications (Tier 1)..."
npm --workspace=apps/admin-portal run build
npm --workspace=apps/vietsub-wasm-studio run build
npm --workspace=apps/telegram-miniapp run build

echo "[Dual Build Matrix] 4/4 Deploying Assets to Cloudflare Pages..."
npx wrangler pages deploy apps/admin-portal/dist --project-name=hendy-admin-portal
npx wrangler pages deploy apps/vietsub-wasm-studio/dist --project-name=hendy-vietsub-studio
npx wrangler pages deploy apps/telegram-miniapp/dist --project-name=hendy-telegram-miniapp

echo "[Dual Build Matrix] Deployment completed successfully!"
