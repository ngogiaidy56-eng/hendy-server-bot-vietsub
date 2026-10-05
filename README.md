# Hendy Server Bot Vietsub — 7-Tier Edge & WASM Monorepo

Kiến trúc Monorepo 7 tầng tích hợp **Cloudflare Worker Central Dispatcher**, **Admin Web Portal L1**, **Vietsub WASM Studio (SubtitlesOctopus C++ & Wavesurfer)**, **Telegram Mini App (React 19)** và **FastAPI GPU Backend (Whisper STT + GPT-4o + FFmpeg Hardsub)**.

## Cấu Trúc Thư Mục
- `.github/workflows/`: CI/CD tự động cấp phát D1, KV, R2 (`devops-pipeline.yml`) và kiểm tra sức khoẻ API Key (`health-check.yml`).
- `.wrangler/`: Thư mục trạng thái cho Wrangler Local Development Engine.
- `apps/admin-portal/`: Admin Web Portal L1 (`Financials/RevenueDashboard.jsx`, `UserManagement/UserTable.jsx`, `VietsubQueue/`, `ConfigMaintenance/`).
- `apps/vietsub-wasm-studio/`: Trạm dựng phụ đề `.ASS` với WebAssembly SubtitlesOctopus, Web SDK, App Packager (Tauri/PWA) và API Gateway.
- `apps/telegram-miniapp/`: Ứng dụng Telegram Mini App React 19 (Shop Code, Nạp VietQR, Dịch vụ MXH).
- `packages/shared-types/`: TypeScript interfaces dùng chung cho toàn bộ D1, KV, R2 và Queue.
- `packages/crypto-vault/`: Thư viện mã hoá AES-256-GCM và xác thực chữ ký HMAC-SHA256.
- `packages/vietsub-sdk/`: Gói NPM `@cyber/vietsub-sdk` nhúng trình phát phụ đề WASM cho bên thứ 3.
- `workers/central-dispatcher/`: Cloudflare Worker Edge Gateway điều phối trung tâm.
- `workers/vietsub-ai-backend/`: Dịch vụ Python FastAPI điều phối GPU Whisper STT, GPT-4o Translation & FFmpeg Burn-in.
- `scripts/` & `database/`: Tập lệnh tự động khởi tạo D1/KV/R2, kiểm tra API key và SQLite migrations.
