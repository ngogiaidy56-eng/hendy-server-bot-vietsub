import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface SubtitleCue {
  id: string;
  start: string; // e.g. "0:00:01.00"
  end: string;   // e.g. "0:00:04.20"
  startSec: number;
  endSec: number;
  speaker: string;
  originalText: string;
  vietsubText: string;
  style: "Default" | "CyberNeon" | "SignTop" | "KaraokeFX";
  effectTag: string;
}

// Initial Stateful Store representing Tier 6 (Cloudflare D1, KV, R2) & Tier 3/4/5 state
const d1Database = {
  users: [
    {
      id: "usr_901",
      telegramId: "684920112",
      username: "minh_kaito",
      fullName: "Trần Minh Quân",
      role: "SUPER_ADMIN",
      vipTier: "VIP_DIAMOND",
      balanceVnd: 18500000,
      totalSpentVnd: 42000000,
      status: "Active",
      updatedAt: "2026-10-05 13:55:00",
    },
    {
      id: "usr_902",
      telegramId: "719283401",
      username: "linh_subteam",
      fullName: "Nguyễn Phương Linh",
      role: "EDITOR_PRO",
      vipTier: "VIP_GOLD",
      balanceVnd: 4250000,
      totalSpentVnd: 12800000,
      status: "Active",
      updatedAt: "2026-10-05 14:01:12",
    },
    {
      id: "usr_903",
      telegramId: "839102445",
      username: "hoang_dev_vn",
      fullName: "Lê Việt Hoàng",
      role: "MEMBER",
      vipTier: "VIP_SILVER",
      balanceVnd: 890000,
      totalSpentVnd: 3150000,
      status: "Active",
      updatedAt: "2026-10-05 13:40:20",
    },
    {
      id: "usr_904",
      telegramId: "901248513",
      username: "khanh_studio",
      fullName: "Phạm Quốc Khánh",
      role: "MEMBER",
      vipTier: "STANDARD",
      balanceVnd: 150000,
      totalSpentVnd: 450000,
      status: "Restricted",
      updatedAt: "2026-10-05 12:18:05",
    },
  ],
  transactions: [
    {
      id: "txn_vqr_8821",
      userId: "usr_902",
      username: "linh_subteam",
      type: "VIETQR_TOPUP",
      route: "nap_tien",
      amountVnd: 1500000,
      bankCode: "MBBank",
      referenceCode: "CYBER9028821",
      status: "Completed",
      createdAt: "2026-10-05 14:01:10",
    },
    {
      id: "txn_shp_8820",
      userId: "usr_903",
      username: "hoang_dev_vn",
      type: "SHOP_CODE_PURCHASE",
      route: "shop_code",
      amountVnd: -650000,
      bankCode: "WALLET_D1",
      referenceCode: "ORD_WASM_SDK_2026",
      status: "Completed",
      createdAt: "2026-10-05 13:52:44",
    },
    {
      id: "txn_vip_8819",
      userId: "usr_901",
      username: "minh_kaito",
      type: "VIP_RENEWAL",
      route: "vip",
      amountVnd: -2400000,
      bankCode: "WALLET_D1",
      referenceCode: "VIP_DIAMOND_ANNUAL",
      status: "Completed",
      createdAt: "2026-10-05 13:30:00",
    },
    {
      id: "txn_mxh_8818",
      userId: "usr_902",
      username: "linh_subteam",
      type: "MXH_SERVICE_ORDER",
      route: "dv_mxh",
      amountVnd: -320000,
      bankCode: "WALLET_D1",
      referenceCode: "MXH_YT_PREMIERE_10K",
      status: "Completed",
      createdAt: "2026-10-05 13:12:09",
    },
  ],
  shopItems: [
    {
      id: "code_01",
      code: "WASM-OCTOPUS-PRO",
      name: "SubtitlesOctopus WASM Worker Kit + Custom Font Pack",
      category: "WASM Engine",
      priceVnd: 650000,
      salesCount: 142,
      version: "v3.4.2",
      storageKeyR2: "r2://cyber-media/releases/wasm-octopus-pro-v3.4.2.tar.gz",
    },
    {
      id: "code_02",
      code: "TELE-MINIAPP-CORE",
      name: "Telegram Bot + React 19 Mini App Cloudflare Worker Template",
      category: "Full-Stack Template",
      priceVnd: 890000,
      salesCount: 98,
      version: "v2.9.0",
      storageKeyR2: "r2://cyber-media/releases/tele-miniapp-core-v2.9.0.zip",
    },
    {
      id: "code_03",
      code: "FFMPEG-HARDSUB-CLUSTER",
      name: "FFmpeg NVENC + ASS Karaoke Hardsub Pipeline Worker",
      category: "Video Pipeline",
      priceVnd: 1250000,
      salesCount: 64,
      version: "v4.1.0",
      storageKeyR2: "r2://cyber-media/releases/ffmpeg-hardsub-v4.1.0.tar.gz",
    },
    {
      id: "code_04",
      code: "VIETQR-WEBHOOK-SYNC",
      name: "VietQR Auto Payment Gateway + D1 Ledger Sync Engine",
      category: "FinTech Module",
      priceVnd: 490000,
      salesCount: 215,
      version: "v1.8.5",
      storageKeyR2: "r2://cyber-media/releases/vietqr-webhook-v1.8.5.zip",
    },
  ],
  gifcodes: [
    {
      code: "CYBERSUB2026",
      rewardVnd: 250000,
      maxUses: 100,
      usedCount: 64,
      expiresAt: "2026-12-31",
      status: "Active",
    },
    {
      code: "WASMSTUDIO500",
      rewardVnd: 500000,
      maxUses: 50,
      usedCount: 19,
      expiresAt: "2026-11-30",
      status: "Active",
    },
    {
      code: "VIPWELCOME",
      rewardVnd: 100000,
      maxUses: 500,
      usedCount: 412,
      expiresAt: "2026-10-30",
      status: "Active",
    },
  ],
  mxhOrders: [
    {
      id: "mxh_501",
      userId: "usr_902",
      platform: "YouTube Premiere",
      serviceName: "Tăng mắt xem Livestream Công Chiếu Anime Vietsub",
      targetUrl: "https://youtube.com/watch?v=cyber_ep12",
      quantity: 10000,
      priceVnd: 320000,
      status: "Completed",
      createdAt: "2026-10-05 13:12:09",
    },
    {
      id: "mxh_502",
      userId: "usr_903",
      platform: "TikTok Reels",
      serviceName: "Seeding Đề Xuất Video Cut Vietsub 60fps",
      targetUrl: "https://tiktok.com/@linh_subteam/video/74199281",
      quantity: 25000,
      priceVnd: 175000,
      status: "Processing",
      createdAt: "2026-10-05 13:59:30",
    },
  ],
  vietsubQueue: [
    {
      id: "job_vs_309",
      title: "Cyberpunk_Edgerunners_SP_Ep04_1080p.mkv",
      submittedBy: "linh_subteam",
      sourceLang: "ja-JP",
      targetLang: "vi-VN",
      sttEngine: "Whisper-Large-v3",
      translateEngine: "Gemini-3.8-Flash / GPT-4o Sync",
      renderMode: "WASM SubtitlesOctopus + FFmpeg Hardsub",
      progress: 100,
      status: "Completed",
      r2OutputKey: "r2://cyber-media/renders/Ep04_Vietsub_Hardsub_1080p.mp4",
      assFileKey: "r2://cyber-media/subtitles/Ep04_Vietsub_Karaoke.ass",
      updatedAt: "2026-10-05 13:58:10",
    },
    {
      id: "job_vs_310",
      title: "Solo_Leveling_Arise_PV_DirectorCut.mp4",
      submittedBy: "minh_kaito",
      sourceLang: "ko-KR",
      targetLang: "vi-VN",
      sttEngine: "Whisper-Large-v3",
      translateEngine: "Gemini-3.8-Flash / GPT-4o Sync",
      renderMode: "WASM SubtitlesOctopus (.ASS Stream)",
      progress: 78,
      status: "Rendering ASS",
      r2OutputKey: "r2://cyber-media/renders/Solo_PV_Vietsub_Stream.m3u8",
      assFileKey: "r2://cyber-media/subtitles/Solo_PV_Vietsub.ass",
      updatedAt: "2026-10-05 14:06:45",
    },
    {
      id: "job_vs_311",
      title: "Black_Myth_DLC_Developer_Diary_4K.webm",
      submittedBy: "hoang_dev_vn",
      sourceLang: "zh-CN",
      targetLang: "vi-VN",
      sttEngine: "Whisper-Large-v3",
      translateEngine: "Gemini-3.8-Flash / GPT-4o Sync",
      renderMode: "FFmpeg NVENC Hardsub Worker",
      progress: 35,
      status: "Translating",
      r2OutputKey: "r2://cyber-media/renders/BlackMyth_DLC_Vietsub_4K.mp4",
      assFileKey: "r2://cyber-media/subtitles/BlackMyth_DLC_Vietsub.ass",
      updatedAt: "2026-10-05 14:08:12",
    },
  ],
};

// Tier 6 Cloudflare KV (Hot-Reload Config & API_KEYS_KV)
const kvStore = {
  config: [
    {
      key: "GATEWAY_HMAC_ENFORCE",
      namespace: "CONFIG_KV",
      value: "true",
      description: "Bắt buộc xác thực chữ ký HMAC-SHA256 trên mọi Webhook & Mini App request",
      updatedAt: "2026-10-05 13:00:00",
    },
    {
      key: "VIETQR_AUTO_WEBHOOK_TOLERANCE",
      namespace: "CONFIG_KV",
      value: "300s",
      description: "Thời gian chấp nhận độ trễ đối soát tự động từ Banking Gateway",
      updatedAt: "2026-10-05 13:15:00",
    },
    {
      key: "WASM_OCTOPUS_MEMORY_LIMIT_MB",
      namespace: "CONFIG_KV",
      value: "512",
      description: "Giới hạn bộ nhớ WebAssembly Heap cho SubtitlesOctopus C++ Renderer",
      updatedAt: "2026-10-05 13:45:00",
    },
    {
      key: "VIP_DIAMOND_CASHBACK_RATE",
      namespace: "CONFIG_KV",
      value: "0.15",
      description: "Tỷ lệ chiết khấu tự động cho thành viên VIP Diamond trên Shop Code & MXH",
      updatedAt: "2026-10-05 14:00:00",
    },
  ],
  apiKeys: [
    {
      keyName: "TELEGRAM_BOT_WEBHOOK_TOKEN",
      namespace: "API_KEYS_KV",
      maskedValue: "718294012:AAH9x_kLp92mQv••••••••••8xL2",
      provider: "Telegram Bot API (Tier 7)",
      status: "Verified",
      lastRotated: "2026-10-04 21:00:00",
    },
    {
      keyName: "VIETQR_MBBANK_WEBHOOK_SECRET",
      namespace: "API_KEYS_KV",
      maskedValue: "vqr_live_99a8c7e6••••••••••4f21",
      provider: "VietQR / Banking Gateway (Tier 7)",
      status: "Verified",
      lastRotated: "2026-10-05 08:30:00",
    },
    {
      keyName: "OPENAI_WHISPER_TRANSLATE_KEY",
      namespace: "API_KEYS_KV",
      maskedValue: "sk-proj-cyber-vietsub••••••••••99aQ",
      provider: "OpenAI & Gemini AI Gateway (Tier 5/7)",
      status: "Verified",
      lastRotated: "2026-10-05 11:20:00",
    },
    {
      keyName: "SOCIAL_MEDIA_PROVIDER_TOKEN",
      namespace: "API_KEYS_KV",
      maskedValue: "smm_vn_live_48291••••••••••009c",
      provider: "Social Media Service APIs (Tier 7)",
      status: "Verified",
      lastRotated: "2026-10-03 19:45:00",
    },
  ],
  sessions: [
    {
      sessionId: "sess_tg_684920112",
      userId: "usr_901",
      username: "minh_kaito",
      clientChannel: "Admin Portal L1 + Mini App",
      activeRoute: "admin_control",
      ttlSeconds: 3540,
      hmacVerified: true,
    },
    {
      sessionId: "sess_tg_719283401",
      userId: "usr_902",
      username: "linh_subteam",
      clientChannel: "Vietsub WASM Studio",
      activeRoute: "/api/vietsub/sync",
      ttlSeconds: 2890,
      hmacVerified: true,
    },
    {
      sessionId: "sess_tg_839102445",
      userId: "usr_903",
      username: "hoang_dev_vn",
      clientChannel: "Telegram Bot Chat",
      activeRoute: "shop_code",
      ttlSeconds: 1740,
      hmacVerified: true,
    },
  ],
};

// Tier 6 Cloudflare R2 Storage Objects
const r2Objects = [
  {
    key: "renders/Ep04_Vietsub_Hardsub_1080p.mp4",
    bucket: "cyber-media-r2",
    sizeMb: 412.8,
    contentType: "video/mp4",
    tierOrigin: "FFmpeg Hardsub Worker (Tier 5)",
    updatedAt: "2026-10-05 13:58:10",
  },
  {
    key: "subtitles/Ep04_Vietsub_Karaoke.ass",
    bucket: "cyber-media-r2",
    sizeMb: 0.48,
    contentType: "text/x-ssa",
    tierOrigin: "WASM Studio Exporter (Tier 1)",
    updatedAt: "2026-10-05 13:56:02",
  },
  {
    key: "fonts/UVN-BanhMi-Bold-Karaoke.woff2",
    bucket: "cyber-media-r2",
    sizeMb: 1.95,
    contentType: "font/woff2",
    tierOrigin: "SubtitlesOctopus Asset (Tier 5)",
    updatedAt: "2026-10-01 10:00:00",
  },
  {
    key: "releases/wasm-octopus-pro-v3.4.2.tar.gz",
    bucket: "cyber-media-r2",
    sizeMb: 28.4,
    contentType: "application/gzip",
    tierOrigin: "Shop Code Engine (Tier 4)",
    updatedAt: "2026-10-04 16:30:00",
  },
];

// Tier 2 DevOps Auto-Bindings & CI/CD Runs
const devopsBindings = [
  {
    bindingName: "DB_CORE_D1",
    resourceType: "Cloudflare D1 (SQLite)",
    resourceId: "d1-8849201a-cyber-prod",
    targetTier: "Tier 6 -> Tier 4 Core Services",
    status: "Bound & Synced",
  },
  {
    bindingName: "API_KEYS_KV",
    resourceType: "Cloudflare KV Namespace",
    resourceId: "kv-991024bc-hotreload",
    targetTier: "Tier 6 -> Tier 3 Dispatcher & Tier 4 Admin",
    status: "Bound & Synced",
  },
  {
    bindingName: "MEDIA_BUCKET_R2",
    resourceType: "Cloudflare R2 Bucket",
    resourceId: "r2-cyber-media-ap-southeast",
    targetTier: "Tier 6 -> Tier 5 FFmpeg Worker & Studio",
    status: "Bound & Synced",
  },
  {
    bindingName: "VIETSUB_AI_SERVICE",
    resourceType: "Cloudflare Service Binding",
    resourceId: "svc-vietsub-whisper-gpt4o",
    targetTier: "Tier 3 Dispatcher -> Tier 5 Vietsub AI",
    status: "Bound & Synced",
  },
];

// Edge Gateway Central Dispatcher Logs (Tier 3)
const gatewayLogs: Array<{
  id: string;
  timestamp: string;
  sourceClient: string;
  route: string;
  targetEngine: string;
  hmacSignature: string;
  rbacRole: string;
  latencyMs: number;
  status: "200 OK" | "403 RBAC_DENIED";
  summary: string;
}> = [
  {
    id: "gw_994",
    timestamp: "14:08:12",
    sourceClient: "WASM Studio (Tier 1)",
    route: "/api/vietsub/translate",
    targetEngine: "WhisperAI -> TranslateAI (Tier 5)",
    hmacSignature: "sha256=9f8e1a4c2d81b09e",
    rbacRole: "EDITOR_PRO",
    latencyMs: 38,
    status: "200 OK",
    summary: "Synced 8 timeline ASS cues to SubtitlesOctopus renderer",
  },
  {
    id: "gw_993",
    timestamp: "14:06:45",
    sourceClient: "Mini App React 19 UI (Tier 1)",
    route: "nap_tien",
    targetEngine: "VietQR Auto Payment Engine (Tier 4)",
    hmacSignature: "sha256=3b71c094a12e88d4",
    rbacRole: "EDITOR_PRO",
    latencyMs: 14,
    status: "200 OK",
    summary: "Verified MBBank webhook CYBER9028821 (+1,500,000 VND to D1)",
  },
  {
    id: "gw_992",
    timestamp: "14:04:19",
    sourceClient: "Telegram Bot Chat (Tier 1)",
    route: "shop_code",
    targetEngine: "Shop Code Engine (Tier 4)",
    hmacSignature: "sha256=7c21e880f41b55a1",
    rbacRole: "MEMBER",
    latencyMs: 11,
    status: "200 OK",
    summary: "Delivered R2 license key for WASM-OCTOPUS-PRO",
  },
  {
    id: "gw_991",
    timestamp: "14:01:02",
    sourceClient: "Admin Web Portal L1 (Tier 1)",
    route: "admin_hot_reload",
    targetEngine: "Admin Control Engine -> CFKV (Tier 4/6)",
    hmacSignature: "sha256=e4019a8c3b77d210",
    rbacRole: "SUPER_ADMIN",
    latencyMs: 9,
    status: "200 OK",
    summary: "Hot-reloaded VIP_DIAMOND_CASHBACK_RATE in CONFIG_KV",
  },
];

// Default Studio Subtitle Timeline Cues
let studioSubtitles: SubtitleCue[] = [
  {
    id: "cue_1",
    start: "0:00:00.50",
    end: "0:00:03.80",
    startSec: 0.5,
    endSec: 3.8,
    speaker: "Kaito",
    originalText: "夜明け前のネオ東京、すべての信号がエッジゲートウェイに集まる。",
    vietsubText: "Neo-Tokyo trước bình minh, mọi tín hiệu đều hội tụ về trạm điều phối Edge Gateway.",
    style: "CyberNeon",
    effectTag: "{\\fad(150,150)\\blur2}",
  },
  {
    id: "cue_2",
    start: "0:00:04.00",
    end: "0:00:07.50",
    startSec: 4.0,
    endSec: 7.5,
    speaker: "Aoi (AI Operator)",
    originalText: "HMAC-SHA256認証完了。WASM SubtitlesOctopusエンジン、起動します。",
    vietsubText: "Xác thực HMAC-SHA256 hoàn tất. Kích hoạt lõi kết xuất WASM SubtitlesOctopus.",
    style: "KaraokeFX",
    effectTag: "{\\k45}Xác {\\k35}thực {\\k60}HMAC-SHA256 {\\k50}hoàn {\\k40}tất.",
  },
  {
    id: "cue_3",
    start: "0:00:07.80",
    end: "0:00:11.60",
    startSec: 7.8,
    endSec: 11.6,
    speaker: "System Sign",
    originalText: "WARNING: HIGH-SPEED SUBTITLE STREAM SYNCING TO CLOUDFLARE R2",
    vietsubText: "CẢNH BÁO: LUỒNG PHỤ ĐỀ TỐC ĐỘ CAO ĐANG ĐỒNG BỘ LÊN CLOUDFLARE R2",
    style: "SignTop",
    effectTag: "{\\an8\\pos(640,56)\\bord1.5}",
  },
  {
    id: "cue_4",
    start: "0:00:11.80",
    end: "0:00:16.00",
    startSec: 11.8,
    endSec: 16.0,
    speaker: "Kaito",
    originalText: "7層アーキテクチャが完全にリンクした。今からハードサブ出力を開始する！",
    vietsubText: "Kiến trúc 7 tầng đã liên kết hoàn toàn. Bắt đầu kết xuất Hardsub ngay bây giờ!",
    style: "Default",
    effectTag: "{\\fad(120,200)}",
  },
];

function computeHmacSignature(payload: string): string {
  const secret = "cyber_edge_gateway_hmac_secret_2026";
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16)
  );
}

function nowFormatted(): string {
  const d = new Date();
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function timeShort(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // 1. Get Unified 7-Tier Platform State
  app.get("/api/state", (_req, res) => {
    const totalRevenueVnd = d1Database.transactions
      .filter((t) => t.amountVnd > 0 && t.status === "Completed")
      .reduce((acc, item) => acc + item.amountVnd, 0);

    const totalPurchasesVnd = d1Database.transactions
      .filter((t) => t.amountVnd < 0 && t.status === "Completed")
      .reduce((acc, item) => acc + Math.abs(item.amountVnd), 0);

    res.json({
      metrics: {
        totalRevenueVnd,
        totalPurchasesVnd,
        activeUsers: d1Database.users.length,
        activeKvKeys: kvStore.config.length + kvStore.apiKeys.length,
        r2StorageMb: Number(
          r2Objects.reduce((acc, o) => acc + o.sizeMb, 0).toFixed(2)
        ),
        queueJobsCount: d1Database.vietsubQueue.length,
      },
      d1Database,
      kvStore,
      r2Objects,
      devopsBindings,
      gatewayLogs,
      studioSubtitles,
    });
  });

  // 2. Tier 3: Cloudflare Worker Central Dispatcher + HMAC-SHA256 & RBAC Auth Guard
  app.post("/api/gateway/dispatch", (req, res) => {
    const {
      sourceClient = "Mini App React 19 UI (Tier 1)",
      route = "shop_code",
      userId = "usr_901",
      payload = {},
    } = req.body;

    const user =
      d1Database.users.find((u) => u.id === userId) || d1Database.users[0];
    const hmacSig = computeHmacSignature(
      `${sourceClient}:${route}:${user.id}:${JSON.stringify(payload)}`
    );

    // RBAC Check for admin_* routes
    if (route.startsWith("admin_") && user.role !== "SUPER_ADMIN") {
      const deniedLog = {
        id: `gw_${Date.now().toString().slice(-4)}`,
        timestamp: timeShort(),
        sourceClient,
        route,
        targetEngine: "AuthGuard RBAC Block (Tier 3)",
        hmacSignature: hmacSig,
        rbacRole: user.role,
        latencyMs: 4,
        status: "403 RBAC_DENIED" as const,
        summary: `Blocked ${user.username} (${user.role}) from invoking ${route}`,
      };
      gatewayLogs.unshift(deniedLog);
      return res.status(403).json({
        ok: false,
        error: `RBAC Auth Guard: Role '${user.role}' không có quyền gọi route '${route}'. Yêu cầu quyền SUPER_ADMIN.`,
        gatewayLog: deniedLog,
      });
    }

    let targetEngine = "Core Service Engine (Tier 4)";
    let summary = "";
    let resultData: Record<string, unknown> = {};

    if (route === "shop_code") {
      targetEngine = "Shop Code Engine (Tier 4) -> CFD1";
      const item =
        d1Database.shopItems.find((i) => i.id === payload.itemId) ||
        d1Database.shopItems[0];

      const discount = user.vipTier === "VIP_DIAMOND" ? 0.85 : user.vipTier === "VIP_GOLD" ? 0.92 : 1;
      const finalPrice = Math.round(item.priceVnd * discount);

      if (user.balanceVnd < finalPrice) {
        return res.status(400).json({
          ok: false,
          error: `Số dư ví D1 không đủ (${user.balanceVnd.toLocaleString()} VND < ${finalPrice.toLocaleString()} VND). Vui lòng nạp thêm qua VietQR.`,
        });
      }

      user.balanceVnd -= finalPrice;
      user.totalSpentVnd += finalPrice;
      user.updatedAt = nowFormatted();
      item.salesCount += 1;

      const licenseKey = `LIC-${item.code}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const txn = {
        id: `txn_shp_${Date.now().toString().slice(-4)}`,
        userId: user.id,
        username: user.username,
        type: "SHOP_CODE_PURCHASE",
        route: "shop_code",
        amountVnd: -finalPrice,
        bankCode: "WALLET_D1",
        referenceCode: licenseKey,
        status: "Completed",
        createdAt: nowFormatted(),
      };
      d1Database.transactions.unshift(txn);
      summary = `Mua thành công ${item.code} (-${finalPrice.toLocaleString()} VND) · Key: ${licenseKey}`;
      resultData = { licenseKey, item, finalPrice, newBalance: user.balanceVnd };
    } else if (route === "nap_tien") {
      targetEngine = "VietQR Auto Payment Engine (Tier 4) <-> BankApi";
      const amount = Number(payload.amountVnd) || 500000;
      const bankCode = String(payload.bankCode || "MBBank");
      const refCode = `CYBER${user.id.replace("usr_", "")}${Date.now().toString().slice(-4)}`;

      user.balanceVnd += amount;
      user.updatedAt = nowFormatted();

      const txn = {
        id: `txn_vqr_${Date.now().toString().slice(-4)}`,
        userId: user.id,
        username: user.username,
        type: "VIETQR_TOPUP",
        route: "nap_tien",
        amountVnd: amount,
        bankCode,
        referenceCode: refCode,
        status: "Completed",
        createdAt: nowFormatted(),
      };
      d1Database.transactions.unshift(txn);
      summary = `Đối soát VietQR ${bankCode} #${refCode} thành công (+${amount.toLocaleString()} VND)`;
      resultData = { referenceCode: refCode, amountVnd: amount, bankCode, newBalance: user.balanceVnd };
    } else if (route === "gifcode") {
      targetEngine = "Gifcode Engine (Tier 4) <-> CFD1";
      const inputCode = String(payload.code || "CYBERSUB2026").trim().toUpperCase();
      const found = d1Database.gifcodes.find((g) => g.code === inputCode);
      if (!found || found.usedCount >= found.maxUses) {
        return res.status(400).json({
          ok: false,
          error: `Mã Gifcode '${inputCode}' không tồn tại hoặc đã hết lượt sử dụng.`,
        });
      }
      found.usedCount += 1;
      user.balanceVnd += found.rewardVnd;
      user.updatedAt = nowFormatted();

      const txn = {
        id: `txn_gif_${Date.now().toString().slice(-4)}`,
        userId: user.id,
        username: user.username,
        type: "GIFCODE_REWARD",
        route: "gifcode",
        amountVnd: found.rewardVnd,
        bankCode: "GIFCODE_ENGINE",
        referenceCode: found.code,
        status: "Completed",
        createdAt: nowFormatted(),
      };
      d1Database.transactions.unshift(txn);
      summary = `Kích hoạt Gifcode ${found.code} (+${found.rewardVnd.toLocaleString()} VND vào ví D1)`;
      resultData = { gifcode: found, newBalance: user.balanceVnd };
    } else if (route === "vip") {
      targetEngine = "VIP & Customer Care Center (Tier 4) <-> CFD1";
      const targetTier = String(payload.vipTier || "VIP_DIAMOND");
      const upgradeCost = targetTier === "VIP_DIAMOND" ? 1200000 : 500000;
      if (user.balanceVnd < upgradeCost) {
        return res.status(400).json({
          ok: false,
          error: `Số dư ví không đủ để nâng cấp ${targetTier} (Cần ${upgradeCost.toLocaleString()} VND).`,
        });
      }
      user.balanceVnd -= upgradeCost;
      user.totalSpentVnd += upgradeCost;
      user.vipTier = targetTier;
      user.updatedAt = nowFormatted();

      const txn = {
        id: `txn_vip_${Date.now().toString().slice(-4)}`,
        userId: user.id,
        username: user.username,
        type: "VIP_UPGRADE",
        route: "vip",
        amountVnd: -upgradeCost,
        bankCode: "WALLET_D1",
        referenceCode: `UPGRADE_${targetTier}`,
        status: "Completed",
        createdAt: nowFormatted(),
      };
      d1Database.transactions.unshift(txn);
      summary = `Nâng cấp đặc quyền ${targetTier} cho @${user.username}`;
      resultData = { vipTier: targetTier, newBalance: user.balanceVnd };
    } else if (route === "dv_mxh") {
      targetEngine = "Dịch Vụ Mạng Xã Hội Engine (Tier 4) <-> SocialApi";
      const quantity = Number(payload.quantity) || 5000;
      const platform = String(payload.platform || "YouTube Premiere");
      const serviceName = String(
        payload.serviceName || "Tăng mắt xem Livestream Công Chiếu Vietsub"
      );
      const targetUrl = String(
        payload.targetUrl || "https://youtube.com/watch?v=vietsub_live"
      );
      const priceVnd = Math.round(quantity * 32);

      if (user.balanceVnd < priceVnd) {
        return res.status(400).json({
          ok: false,
          error: `Số dư ví không đủ thanh toán đơn MXH (${priceVnd.toLocaleString()} VND).`,
        });
      }
      user.balanceVnd -= priceVnd;
      user.totalSpentVnd += priceVnd;
      user.updatedAt = nowFormatted();

      const order = {
        id: `mxh_${Date.now().toString().slice(-3)}`,
        userId: user.id,
        platform,
        serviceName,
        targetUrl,
        quantity,
        priceVnd,
        status: "Processing",
        createdAt: nowFormatted(),
      };
      d1Database.mxhOrders.unshift(order);

      const txn = {
        id: `txn_mxh_${Date.now().toString().slice(-4)}`,
        userId: user.id,
        username: user.username,
        type: "MXH_SERVICE_ORDER",
        route: "dv_mxh",
        amountVnd: -priceVnd,
        bankCode: "WALLET_D1",
        referenceCode: order.id.toUpperCase(),
        status: "Completed",
        createdAt: nowFormatted(),
      };
      d1Database.transactions.unshift(txn);
      summary = `Đặt đơn MXH ${platform} (${quantity.toLocaleString()} lượt · -${priceVnd.toLocaleString()} VND)`;
      resultData = { order, newBalance: user.balanceVnd };
    } else if (route.startsWith("admin_")) {
      targetEngine = "Admin Control Engine (Tier 4) -> CFD1 & CFKV";
      if (route === "admin_adjust_user") {
        const targetUser = d1Database.users.find(
          (u) => u.id === payload.targetUserId
        );
        if (targetUser) {
          if (payload.deltaBalance !== undefined) {
            targetUser.balanceVnd += Number(payload.deltaBalance);
          }
          if (payload.newRole) {
            targetUser.role = String(payload.newRole);
          }
          if (payload.newVipTier) {
            targetUser.vipTier = String(payload.newVipTier);
          }
          if (payload.newStatus) {
            targetUser.status = String(payload.newStatus);
          }
          targetUser.updatedAt = nowFormatted();
          summary = `RBAC Admin cập nhật @${targetUser.username}: role=${targetUser.role}, vip=${targetUser.vipTier}, status=${targetUser.status}, ví=${targetUser.balanceVnd.toLocaleString()} VND`;
          resultData = { updatedUser: targetUser };
        }
      } else if (route === "admin_hot_reload") {
        const configKey = String(payload.key || "WASM_OCTOPUS_MEMORY_LIMIT_MB");
        const configVal = String(payload.value || "1024");
        const existing = kvStore.config.find((c) => c.key === configKey);
        if (existing) {
          existing.value = configVal;
          existing.updatedAt = nowFormatted();
        } else {
          kvStore.config.unshift({
            key: configKey,
            namespace: "CONFIG_KV",
            value: configVal,
            description: String(payload.description || "Dynamic Hot-Reload Config"),
            updatedAt: nowFormatted(),
          });
        }
        summary = `Hot-Reload KV: ${configKey} = ${configVal} (Đồng bộ tức thời tới Edge Dispatcher)`;
        resultData = { configKey, configVal };
      } else if (route === "admin_rotate_key") {
        const keyName = String(payload.keyName || "TELEGRAM_BOT_WEBHOOK_TOKEN");
        const rawSecret = String(payload.rawSecret || "live_token_998123");
        const masked =
          rawSecret.slice(0, 10) +
          "••••••••••" +
          rawSecret.slice(Math.max(0, rawSecret.length - 4));
        const foundKey = kvStore.apiKeys.find((k) => k.keyName === keyName);
        if (foundKey) {
          foundKey.maskedValue = masked;
          foundKey.lastRotated = nowFormatted();
          foundKey.status = "Verified";
        } else {
          kvStore.apiKeys.unshift({
            keyName,
            namespace: "API_KEYS_KV",
            maskedValue: masked,
            provider: String(payload.provider || "External API Tier 7"),
            status: "Verified",
            lastRotated: nowFormatted(),
          });
        }
        summary = `Auto-Validate & Save API Key '${keyName}' vào API_KEYS_KV`;
        resultData = { keyName, masked };
      }
    }

    const logEntry = {
      id: `gw_${Date.now().toString().slice(-4)}`,
      timestamp: timeShort(),
      sourceClient,
      route,
      targetEngine,
      hmacSignature: hmacSig,
      rbacRole: user.role,
      latencyMs: Math.floor(Math.random() * 18) + 8,
      status: "200 OK" as const,
      summary: summary || `Dispatched route ${route} via Edge Worker`,
    };
    gatewayLogs.unshift(logEntry);

    res.json({
      ok: true,
      gatewayLog: logEntry,
      resultData,
    });
  });

  // 3. Tier 5: Vietsub AI Backend (Whisper STT + Gemini/GPT-4o Translation -> Timeline Subtitle JSON & .ASS File)
  app.post("/api/vietsub/ai-process", async (req, res) => {
    try {
      const {
        sourceText = "",
        sourceLang = "ja-JP",
        stylePreset = "CyberNeon",
        videoTitle = "Anime_Episode_Master.mkv",
      } = req.body;

      const prompt = `Bạn là hệ thống Vietsub AI Engine (Tier 5: Whisper STT + GPT-4o / Gemini Translation) chuyên dịch phụ đề phim/anime/video sang tiếng Việt chuẩn ngữ cảnh và tạo timeline phụ đề cho SubtitlesOctopus WASM (.ASS).
Ngôn ngữ nguồn: ${sourceLang}
Phong cách ASS mặc định: ${stylePreset}
Nội dung thoại / kịch bản đầu vào:
"""
${sourceText || "1. 00:00:01 - 00:00:04: Hệ thống phòng thủ biên giới Cloudflare Worker đã kích hoạt.\n2. 00:00:04 - 00:00:08: Mọi luồng dữ liệu phụ đề đang được giải mã bằng WebAssembly ở tốc độ 60 khung hình/giây.\n3. 00:00:08 - 00:00:12: Chuẩn bị xuất bản file Hardsub lên kho lưu trữ đám mây R2!"}
"""

Hãy phân tích và trả về danh sách từ 4 đến 6 câu phụ đề (SubtitleCue) khớp thời gian liên속 từ giây 0.5 đến giây 16.0.
Mỗi câu phụ đề phải có:
- id: "cue_1", "cue_2", ...
- start: định dạng ASS "0:00:01.00"
- end: định dạng ASS "0:00:04.20"
- startSec: số thực giây bắt đầu (ví dụ 1.0)
- endSec: số thực giây kết thúc (ví dụ 4.2)
- speaker: tên nhân vật hoặc "Narrator" / "System Sign"
- originalText: câu thoại ngôn ngữ gốc (${sourceLang})
- vietsubText: bản dịch tiếng Việt tự nhiên, giàu cảm xúc điện ảnh
- style: một trong ["Default", "CyberNeon", "SignTop", "KaraokeFX"]
- effectTag: thẻ ASS override hợp lệ như "{\\fad(150,150)\\blur1.5}" hoặc "{\\k40}Từ {\\k50}ngữ"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                start: { type: Type.STRING },
                end: { type: Type.STRING },
                startSec: { type: Type.NUMBER },
                endSec: { type: Type.NUMBER },
                speaker: { type: Type.STRING },
                originalText: { type: Type.STRING },
                vietsubText: { type: Type.STRING },
                style: { type: Type.STRING },
                effectTag: { type: Type.STRING },
              },
              required: [
                "id",
                "start",
                "end",
                "startSec",
                "endSec",
                "speaker",
                "originalText",
                "vietsubText",
                "style",
                "effectTag",
              ],
            },
          },
        },
      });

      const parsedCues = JSON.parse(response.text || "[]") as SubtitleCue[];
      if (Array.isArray(parsedCues) && parsedCues.length > 0) {
        studioSubtitles = parsedCues;
      }

      // Register job in Vietsub AI Queue (Tier 1 A3 & Tier 5)
      const newJob = {
        id: `job_vs_${Date.now().toString().slice(-3)}`,
        title: videoTitle,
        submittedBy: "linh_subteam",
        sourceLang,
        targetLang: "vi-VN",
        sttEngine: "Whisper-Large-v3",
        translateEngine: "Gemini-3.8-Flash / GPT-4o Sync",
        renderMode: "WASM SubtitlesOctopus + FFmpeg Hardsub",
        progress: 100,
        status: "Completed",
        r2OutputKey: `r2://cyber-media/renders/${videoTitle.replace(/\s+/g, "_")}_Vietsub.mp4`,
        assFileKey: `r2://cyber-media/subtitles/${videoTitle.replace(/\s+/g, "_")}.ass`,
        updatedAt: nowFormatted(),
      };
      d1Database.vietsubQueue.unshift(newJob);

      gatewayLogs.unshift({
        id: `gw_${Date.now().toString().slice(-4)}`,
        timestamp: timeShort(),
        sourceClient: "WASM Studio (Tier 1)",
        route: "/api/vietsub/ai-process",
        targetEngine: "WhisperAI -> TranslateAI -> WASMStudio (Tier 5)",
        hmacSignature: computeHmacSignature(videoTitle),
        rbacRole: "EDITOR_PRO",
        latencyMs: 42,
        status: "200 OK",
        summary: `AI Vietsub generated ${studioSubtitles.length} timed ASS cues for ${videoTitle}`,
      });

      res.json({
        ok: true,
        cues: studioSubtitles,
        job: newJob,
      });
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "AI Vietsub processing error";
      res.status(500).json({ ok: false, error: errMsg });
    }
  });

  // 4. Update Studio Subtitle Cues or Export to FFmpeg R2 Worker
  app.post("/api/vietsub/export-hardsub", (req, res) => {
    const { videoTitle = "Cyber_Episode_Final.mp4", cues } = req.body;
    if (Array.isArray(cues) && cues.length > 0) {
      studioSubtitles = cues;
    }

    const cleanName = videoTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const r2AssKey = `subtitles/${cleanName}_Karaoke.ass`;
    const r2Mp4Key = `renders/${cleanName}_Hardsub_1080p.mp4`;

    r2Objects.unshift(
      {
        key: r2Mp4Key,
        bucket: "cyber-media-r2",
        sizeMb: 348.5,
        contentType: "video/mp4",
        tierOrigin: "FFmpeg Hardsub Worker (Tier 5)",
        updatedAt: nowFormatted(),
      },
      {
        key: r2AssKey,
        bucket: "cyber-media-r2",
        sizeMb: 0.52,
        contentType: "text/x-ssa",
        tierOrigin: "WASM Studio Exporter (Tier 1)",
        updatedAt: nowFormatted(),
      }
    );

    const job = {
      id: `job_vs_${Date.now().toString().slice(-3)}`,
      title: videoTitle,
      submittedBy: "minh_kaito",
      sourceLang: "ja-JP",
      targetLang: "vi-VN",
      sttEngine: "Whisper-Large-v3",
      translateEngine: "SubtitlesOctopus WASM Sync",
      renderMode: "FFmpeg Hardsub Render Worker -> R2",
      progress: 100,
      status: "Completed",
      r2OutputKey: `r2://cyber-media/${r2Mp4Key}`,
      assFileKey: `r2://cyber-media/${r2AssKey}`,
      updatedAt: nowFormatted(),
    };
    d1Database.vietsubQueue.unshift(job);

    gatewayLogs.unshift({
      id: `gw_${Date.now().toString().slice(-4)}`,
      timestamp: timeShort(),
      sourceClient: "WASM Studio (Tier 1)",
      route: "/api/vietsub/export-hardsub",
      targetEngine: "FFmpegWorker <-> CFR2 (Tier 5/6)",
      hmacSignature: computeHmacSignature(cleanName),
      rbacRole: "SUPER_ADMIN",
      latencyMs: 29,
      status: "200 OK",
      summary: `FFmpeg Worker rendered ${r2Mp4Key} & stored .ASS in Cloudflare R2`,
    });

    res.json({
      ok: true,
      job,
      r2AssKey,
      r2Mp4Key,
    });
  });

  // 5. Tier 2: DevOps Auto-Provisioning & Dual Build Matrix Trigger
  app.post("/api/devops/provision", (req, res) => {
    const {
      bindingName = "CACHE_EDGE_KV",
      resourceType = "Cloudflare KV Namespace",
      targetTier = "Tier 6 -> Tier 3 Dispatcher",
    } = req.body;

    const newBinding = {
      bindingName: bindingName.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      resourceType,
      resourceId: `cf-${crypto.randomBytes(4).toString("hex")}-auto`,
      targetTier,
      status: "Bound & Synced",
    };
    devopsBindings.unshift(newBinding);

    gatewayLogs.unshift({
      id: `gw_${Date.now().toString().slice(-4)}`,
      timestamp: timeShort(),
      sourceClient: "GitHub Actions CI/CD (Tier 2)",
      route: "devops_auto_bind",
      targetEngine: "AutoProvision -> CFD1/CFKV/CFR2 (Tier 2/6)",
      hmacSignature: computeHmacSignature(newBinding.bindingName),
      rbacRole: "CI_CD_BOT",
      latencyMs: 19,
      status: "200 OK",
      summary: `Auto-provisioned ${newBinding.bindingName} (${newBinding.resourceId}) & deployed Dual Matrix`,
    });

    res.json({
      ok: true,
      binding: newBinding,
    });
  });

  // 6. Monorepo Source Tree & File Content Reader (Root Monorepo Layout)
  app.get("/api/monorepo/files", (_req, res) => {
    const cwd = process.cwd();
    const monorepoFolders = [
      ".github",
      ".wrangler",
      "apps",
      "packages",
      "workers",
      "scripts",
      "database",
    ];
    const rootFiles = [
      ".env.example",
      ".gitignore",
      "package.json",
      "README.md",
      "wrangler.jsonc",
    ];

    const files: Array<{
      path: string;
      category: string;
      sizeBytes: number;
      content: string;
    }> = [];

    function walkDir(currentPath: string, category: string) {
      if (!fs.existsSync(currentPath)) return;
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist") continue;
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, category);
        } else if (entry.isFile()) {
          const relPath = path.relative(cwd, fullPath).replace(/\\/g, "/");
          const content = fs.readFileSync(fullPath, "utf8");
          files.push({
            path: relPath,
            category,
            sizeBytes: Buffer.byteLength(content, "utf8"),
            content,
          });
        }
      }
    }

    for (const folder of monorepoFolders) {
      walkDir(path.join(cwd, folder), folder);
    }

    for (const rf of rootFiles) {
      const fullPath = path.join(cwd, rf);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, "utf8");
        files.push({
          path: rf,
          category: "root",
          sizeBytes: Buffer.byteLength(content, "utf8"),
          content,
        });
      }
    }

    res.json({ ok: true, count: files.length, files });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CyberSub Edge 7-Tier Server running on http://localhost:${PORT}`);
  });
}

startServer();
