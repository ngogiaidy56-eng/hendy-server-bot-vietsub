import React, { useState } from "react";
import { PlatformState, ActiveWorkspaceTab } from "../types/platform";
import { ArrowUpRight, Network, Layers } from "lucide-react";

interface ArchitectureTopologyViewProps {
  state: PlatformState;
  onNavigateTab: (tab: ActiveWorkspaceTab) => void;
}

interface ArchNode {
  id: string;
  tier: string;
  code: string;
  title: string;
  routeTarget: ActiveWorkspaceTab;
  inbound: string;
  outbound: string;
  description: string;
}

const ARCH_TIERS: Array<{
  tierNumber: string;
  tierTitle: string;
  nodes: ArchNode[];
}> = [
  {
    tierNumber: "TẦNG 1 (TIER 1)",
    tierTitle: "Tầng Khách Hàng, Admin & Web/App Engine",
    nodes: [
      {
        id: "AdminPortal",
        tier: "L1",
        code: "A1–A4",
        title: "Admin Web Portal L1 (Doanh thu, RBAC, Queue, Hot-Reload KV)",
        routeTarget: "admin",
        inbound: "Dual Build Matrix (Cloudflare Pages)",
        outbound: "RBAC Admin Commands -> Central Dispatcher",
        description:
          "Trung tâm quản trị cấp cao giám sát dòng tiền VietQR, điều chỉnh số dư ví & quyền RBAC, quản lý hàng đợi Vietsub AI và cập nhật nóng biến cấu hình Cloudflare KV.",
      },
      {
        id: "WASMStudio",
        tier: "L1",
        code: "S1–S4",
        title: "Vietsub WASM Studio & App/Web Dev Engine",
        routeTarget: "studio",
        inbound: "Timeline Subtitle JSON <- TranslateAI",
        outbound: "Final .ASS File -> FFmpegWorker & SubtitlesOctopus",
        description:
          "Trạm dựng phụ đề tương tác tích hợp Web SDK (@cyber/vietsub-sdk), đóng gói PWA/Tauri/Mobile và kết xuất trực tiếp định dạng .ASS với SubtitlesOctopus.",
      },
      {
        id: "BotMiniApp",
        tier: "L1",
        code: "BotUI / MiniAppUI",
        title: "Telegram Bot Chat & Mini App React 19 UI",
        routeTarget: "client",
        inbound: "Telegram Webhook & Cloudflare Pages",
        outbound: "Webhook Callbacks & REST Auth API -> Dispatcher",
        description:
          "Giao diện người dùng cuối trên Telegram cho phép mua Shop Code, nạp tiền tự động VietQR, nâng cấp VIP, đổi Gifcode và đặt đơn dịch vụ MXH.",
      },
    ],
  },
  {
    tierNumber: "TẦNG 2 (TIER 2)",
    tierTitle: "Tầng DevOps Automation & Auto-Bindings",
    nodes: [
      {
        id: "GHRepoActions",
        tier: "L2",
        code: "GHRepo -> GHActions",
        title: "GitHub Monorepo & GitHub Actions CI/CD Engine",
        routeTarget: "devops",
        inbound: "Git Push (Main Branch)",
        outbound: "Trigger Auto-Provision & Dual Build Matrix",
        description:
          "Tự động hoá kiểm thử, biên dịch TypeScript/WASM và kích hoạt quy trình cấp phát hạ tầng Cloudflare khi có commit mới.",
      },
      {
        id: "AutoProvision",
        tier: "L2",
        code: "B_Res / B_Key / B_Build",
        title: "Auto-Bindings & Secret Save Engine (Workers & Pages Matrix)",
        routeTarget: "devops",
        inbound: "GitHub Actions CI/CD Engine",
        outbound: "Provision & Bind -> CFD1, CFKV, CFR2 & Dispatcher",
        description:
          "Tự động khởi tạo cơ sở dữ liệu D1, KV, R2, xác thực API Keys lưu vào API_KEYS_KV và triển khai song song Workers + Pages.",
      },
    ],
  },
  {
    tierNumber: "TẦNG 3 (TIER 3)",
    tierTitle: "Trạm Trung Gian Điều Phối (Edge Gateway)",
    nodes: [
      {
        id: "Dispatcher",
        tier: "L3",
        code: "Dispatcher",
        title: "Cloudflare Worker Central Dispatcher",
        routeTarget: "devops",
        inbound: "BotUI, MiniAppUI, AdminPortal, WASMStudio",
        outbound: "Route: shop_code, nap_tien, vip, gifcode, dv_mxh, admin_*, /api/vietsub/*",
        description:
          "Trạm điều phối biên độ trễ thấp (<15ms) phân luồng toàn bộ yêu cầu từ các ứng dụng Tier 1 về các mô-đun Core Tier 4 và AI Tier 5.",
      },
      {
        id: "AuthGuard",
        tier: "L3",
        code: "AuthGuard / StateManager",
        title: "HMAC-SHA256 & RBAC Auth Guard + Session State Manager",
        routeTarget: "devops",
        inbound: "Cloudflare Worker Central Dispatcher",
        outbound: "Bidirectional Sync <-> Cloudflare KV (CFKV)",
        description:
          "Kiểm tra chữ ký mật mã HMAC-SHA256 trên từng gói tin, đối chiếu quyền hạn RBAC và đồng bộ trạng thái phiên làm việc với Cloudflare KV.",
      },
    ],
  },
  {
    tierNumber: "TẦNG 4 (TIER 4)",
    tierTitle: "Tầng Mô-đun Dịch Vụ Core (Core Services)",
    nodes: [
      {
        id: "CoreShopPayment",
        tier: "L4",
        code: "ModShop / ModNapTien",
        title: "Shop Code Engine & VietQR Auto Payment Engine",
        routeTarget: "client",
        inbound: "Dispatcher (Route: shop_code | nap_tien)",
        outbound: "Cloudflare D1 (CFD1) & VietQR Banking Gateway (BankApi)",
        description:
          "Xử lý mua bán mã nguồn tự động xuất kho R2 và đối soát biến động số dư ngân hàng qua chuẩn VietQR 24/7.",
      },
      {
        id: "CoreVipGifMxh",
        tier: "L4",
        code: "ModVIP / ModGifcode / ModMXH",
        title: "VIP Center, Gifcode Engine & Dịch Vụ Mạng Xã Hội Engine",
        routeTarget: "client",
        inbound: "Dispatcher (Route: vip | gifcode | dv_mxh)",
        outbound: "Cloudflare D1 (CFD1) & Social Media APIs (SocialApi)",
        description:
          "Quản lý cấp bậc thành viên VIP, phát hành mã thưởng Gifcode và tự động đẩy đơn tương tác mạng xã hội sang các nhà cung cấp ngoại vi.",
      },
      {
        id: "ModAdminCore",
        tier: "L4",
        code: "ModAdminCore",
        title: "Admin Control Engine",
        routeTarget: "admin",
        inbound: "Dispatcher (Route: admin_*)",
        outbound: "Cloudflare D1 (CFD1) & Save Dynamic Keys -> CFKV",
        description:
          "Thực thi các lệnh quản trị đặc quyền, điều chỉnh ví D1 và ghi nhận khoá cấu hình động vào Cloudflare KV.",
      },
    ],
  },
  {
    tierNumber: "TẦNG 5 (TIER 5)",
    tierTitle: "Phân Hệ Vietsub AI Backend & WASM",
    nodes: [
      {
        id: "WASM_Octo",
        tier: "L5",
        code: "WASM_Octo",
        title: "SubtitlesOctopus (WASM C++ Client Render)",
        routeTarget: "studio",
        inbound: "Client Local Render <-> WASMStudio",
        outbound: "60fps Canvas Overlay (.ASS Vector & Karaoke)",
        description:
          "Nhân C++ libass biên dịch sang WebAssembly giúp hiển thị hiệu ứng phụ đề Karaoke và排版 phức tạp trực tiếp trên trình duyệt mà không cần chờ encode lại video.",
      },
      {
        id: "WhisperTranslateFFmpeg",
        tier: "L5",
        code: "WhisperAI -> TranslateAI -> FFmpegWorker",
        title: "Whisper STT + Gemini/GPT-4o Translation + FFmpeg Hardsub Worker",
        routeTarget: "studio",
        inbound: "Dispatcher (/api/vietsub/*) & Final .ASS File",
        outbound: "Timeline Subtitle JSON -> WASMStudio & Hardsub MP4 -> CFR2",
        description:
          "Chuỗi xử lý nhận diện giọng nói đa ngôn ngữ, dịch thuật ngữ cảnh điện ảnh sang tiếng Việt và đóng dấu phụ đề cứng (Hardsub) lưu trữ lên R2.",
      },
    ],
  },
  {
    tierNumber: "TẦNG 6 & 7 (TIER 6 & 7)",
    tierTitle: "Tầng Lưu Trữ Cloudflare (D1, KV, R2) & Tích Hợp Ngoại Vi",
    nodes: [
      {
        id: "CFStorage",
        tier: "L6",
        code: "CFD1 / CFKV / CFR2",
        title: "Cloudflare D1 (SQLite) · Cloudflare KV · Cloudflare R2",
        routeTarget: "devops",
        inbound: "Core Services Tier 4, AutoProvision Tier 2, FFmpegWorker Tier 5",
        outbound: "Persistent State, Hot-Reload Secrets & Media Streams",
        description:
          "Tầng lưu trữ biên hợp nhất: D1 lưu sổ cái giao dịch & tài khoản, KV lưu phiên & cấu hình nóng, R2 lưu trữ video 4K và tệp phụ đề .ASS.",
      },
      {
        id: "ExternalAPIs",
        tier: "L7",
        code: "TGApi / BankApi / OpenAIApi / SocialApi",
        title: "Telegram Bot API · VietQR Gateway · AI API · Social Media APIs",
        routeTarget: "client",
        inbound: "Dispatcher, ModNapTien, WhisperAI/TranslateAI, ModMXH",
        outbound: "Webhooks, Payment Confirmations, AI Completions",
        description:
          "Các cổng giao tiếp bên ngoài được bảo mật bằng khoá động lấy từ API_KEYS_KV.",
      },
    ],
  },
];

export const ArchitectureTopologyView: React.FC<
  ArchitectureTopologyViewProps
> = ({ state, onNavigateTab }) => {
  const [selectedNode, setSelectedNode] = useState<ArchNode>(
    ARCH_TIERS[0].nodes[0]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive 7-Tier Architecture Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {ARCH_TIERS.map((tierGroup) => (
            <div
              key={tierGroup.tierNumber}
              className="bg-[#111827] border border-slate-800/90 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono font-semibold text-sky-400">
                    {tierGroup.tierNumber}
                  </span>
                  <span className="text-slate-600">·</span>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {tierGroup.tierTitle}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {tierGroup.nodes.map((node) => {
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`text-left p-3.5 rounded-md border transition-colors flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "bg-sky-950/35 border-sky-400 text-slate-100"
                          : "bg-[#0B0F17] border-slate-800/90 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-[11px] font-mono text-sky-400">
                          {node.tier} · {node.code}
                        </div>
                        <div className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
                          {node.title}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {node.outbound}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right 4 Cols: Selected Node Inspector & Direct Module Launcher */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827] border border-slate-800/90 rounded-lg p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-semibold text-sky-400">
                  NODE INSPECTOR ({selectedNode.tier})
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Active · Synced
              </span>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-400">
                Mã Định Danh Kiến Trúc: {selectedNode.code}
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-1">
                {selectedNode.title}
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block">Luồng Vào (Inbound):</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {selectedNode.inbound}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Luồng Ra (Outbound):</span>
                <span className="font-mono text-sky-300 mt-0.5 block">
                  {selectedNode.outbound}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="text-slate-400">
                Số liệu thực tế đang lưu chuyển qua hệ thống:
              </div>
              <div className="font-mono tabular-nums text-slate-200 space-y-1">
                <div>
                  · D1 Transactions: {state.d1Database.transactions.length} bản ghi
                </div>
                <div>
                  · Edge Gateway Packets: {state.gatewayLogs.length} gói tin
                </div>
                <div>
                  · R2 Storage Objects: {state.r2Objects.length} tệp ({state.metrics.r2StorageMb} MB)
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab(selectedNode.routeTarget)}
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Mở Trực Tiếp Phân Hệ Này
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
