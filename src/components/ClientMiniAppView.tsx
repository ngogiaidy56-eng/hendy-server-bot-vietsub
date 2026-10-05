import React, { useState } from "react";
import { PlatformState } from "../types/platform";
import miniappBanner from "../assets/images/miniapp_showcase_banner_1791234624919.jpg";
import {
  Send,
  ShoppingBag,
  CreditCard,
  Crown,
  Gift,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Terminal,
} from "lucide-react";

interface ClientMiniAppViewProps {
  state: PlatformState;
  onDispatch: (
    route: string,
    payload: Record<string, unknown>,
    sourceClient?: string,
    userId?: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    resultData?: Record<string, unknown>;
  }>;
}

interface BotChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  routeTag?: string;
  timestamp: string;
}

export const ClientMiniAppView: React.FC<ClientMiniAppViewProps> = ({
  state,
  onDispatch,
}) => {
  const [activeUserId, setActiveUserId] = useState<string>("usr_902");
  const [miniAppTab, setMiniAppTab] = useState<
    "shop_code" | "nap_tien" | "vip" | "gifcode" | "dv_mxh"
  >("shop_code");

  // VietQR Top-up State
  const [topupAmount, setTopupAmount] = useState<number>(500000);
  const [topupBank, setTopupBank] = useState<string>("MBBank");

  // Gifcode State
  const [gifcodeInput, setGifcodeInput] = useState<string>("CYBERSUB2026");

  // MXH Service State
  const [mxhPlatform, setMxhPlatform] = useState<string>("YouTube Premiere");
  const [mxhServiceName, setMxhServiceName] = useState<string>(
    "Tăng mắt xem Livestream Công Chiếu Anime Vietsub"
  );
  const [mxhTargetUrl, setMxhTargetUrl] = useState<string>(
    "https://youtube.com/watch?v=cyber_vietsub_ep05"
  );
  const [mxhQuantity, setMxhQuantity] = useState<number>(5000);

  // Bot Chat State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<BotChatMessage[]>([
    {
      id: "msg_1",
      sender: "bot",
      text: "Chào mừng tới CyberSub Telegram Bot (Kết nối Cloudflare Worker Dispatcher Tier 3). Chọn lệnh nhanh bên dưới hoặc mở Mini App React 19 UI để giao dịch tức thời.",
      routeTag: "Webhook: TGApi <-> Dispatcher",
      timestamp: "14:00:05",
    },
  ]);

  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  const currentUser =
    state.d1Database.users.find((u) => u.id === activeUserId) ||
    state.d1Database.users[0];

  const appendBotLog = (
    userCmd: string,
    botReply: string,
    routeTag: string
  ) => {
    const now = new Date().toTimeString().slice(0, 8);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        sender: "user",
        text: userCmd,
        timestamp: now,
      },
      {
        id: `b_${Date.now() + 1}`,
        sender: "bot",
        text: botReply,
        routeTag,
        timestamp: now,
      },
    ]);
  };

  const handleBotQuickCommand = async (cmd: string) => {
    setIsDispatching(true);
    setActionBanner(null);

    if (cmd === "/shop_code") {
      setMiniAppTab("shop_code");
      appendBotLog(
        "/shop_code",
        `Đang hiển thị ${state.d1Database.shopItems.length} gói mã nguồn WASM & Worker từ D1. Hạng ${currentUser.vipTier} của bạn được áp dụng chiết khấu tự động.`,
        "Route: shop_code -> ModShop"
      );
      setIsDispatching(false);
      return;
    }

    if (cmd === "/nap_tien") {
      setMiniAppTab("nap_tien");
      const res = await onDispatch(
        "nap_tien",
        { amountVnd: 500000, bankCode: "MBBank" },
        "Telegram Bot Chat (Tier 1)",
        currentUser.id
      );
      if (res.ok) {
        appendBotLog(
          "/nap_tien 500000",
          `Đối soát VietQR tự động thành công (+500,000 VND). Số dư ví D1 mới: ${Number(
            res.resultData?.newBalance || currentUser.balanceVnd
          ).toLocaleString()} VND.`,
          "Route: nap_tien -> ModNapTien <-> BankApi"
        );
      }
      setIsDispatching(false);
      return;
    }

    if (cmd === "/gifcode") {
      setMiniAppTab("gifcode");
      const res = await onDispatch(
        "gifcode",
        { code: "VIPWELCOME" },
        "Telegram Bot Chat (Tier 1)",
        currentUser.id
      );
      if (res.ok) {
        appendBotLog(
          "/gifcode VIPWELCOME",
          `Kích hoạt mã VIPWELCOME thành công (+100,000 VND vào ví D1).`,
          "Route: gifcode -> ModGifcode"
        );
      } else {
        appendBotLog(
          "/gifcode VIPWELCOME",
          res.error || "Mã Gifcode không hợp lệ.",
          "Route: gifcode -> ModGifcode"
        );
      }
      setIsDispatching(false);
      return;
    }

    if (cmd === "/vip") {
      setMiniAppTab("vip");
      appendBotLog(
        "/vip",
        `Tài khoản @${currentUser.username} hiện đang ở hạng ${currentUser.vipTier} (Vai trò: ${currentUser.role}). Mở tab Đặc Quyền VIP trên Mini App để nâng cấp.`,
        "Route: vip / kh -> ModVIP"
      );
      setIsDispatching(false);
    }
  };

  const handleSendCustomChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    if (text.startsWith("/")) {
      await handleBotQuickCommand(text.split(" ")[0]);
    } else {
      appendBotLog(
        text,
        `Edge Dispatcher đã xác thực HMAC-SHA256 cho phiên @${currentUser.username}. Vui lòng chọn chức năng trong Mini App React 19 UI hoặc gõ /shop_code, /nap_tien, /gifcode, /vip.`,
        "Dispatcher -> StateManager <-> CFKV"
      );
    }
  };

  // Mini App Actions
  const handleBuyShopCode = async (itemId: string) => {
    setIsDispatching(true);
    setActionBanner(null);
    const res = await onDispatch(
      "shop_code",
      { itemId },
      "Mini App React 19 UI (Tier 1)",
      currentUser.id
    );
    setIsDispatching(false);
    if (res.ok) {
      const key = String(res.resultData?.licenseKey || "LIC-OK");
      setActionBanner({
        type: "success",
        text: `Mua thành công! License Key từ D1/R2: ${key}`,
      });
      appendBotLog(
        `[MiniApp] Mua gói ${itemId}`,
        `Đã xuất kho R2 & trừ ví D1. Mã kích hoạt của bạn: ${key}`,
        "Route: shop_code -> ModShop <-> CFD1"
      );
    } else {
      setActionBanner({
        type: "error",
        text: res.error || "Giao dịch thất bại.",
      });
    }
  };

  const handleVietQrTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setActionBanner(null);
    const res = await onDispatch(
      "nap_tien",
      { amountVnd: topupAmount, bankCode: topupBank },
      "Mini App React 19 UI (Tier 1)",
      currentUser.id
    );
    setIsDispatching(false);
    if (res.ok) {
      const refCode = String(res.resultData?.referenceCode || "CYBERVQR");
      setActionBanner({
        type: "success",
        text: `VietQR Auto Payment đối soát thành công #${refCode}: +${topupAmount.toLocaleString()} VND vào ví D1!`,
      });
      appendBotLog(
        `[MiniApp] Nạp VietQR ${topupBank}`,
        `Ngân hàng xác nhận giao dịch #${refCode} (+${topupAmount.toLocaleString()} VND).`,
        "Route: nap_tien -> ModNapTien <-> BankApi"
      );
    }
  };

  const handleRedeemGifcode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setActionBanner(null);
    const res = await onDispatch(
      "gifcode",
      { code: gifcodeInput },
      "Mini App React 19 UI (Tier 1)",
      currentUser.id
    );
    setIsDispatching(false);
    if (res.ok) {
      setActionBanner({
        type: "success",
        text: `Đã quy đổi mã Gifcode '${gifcodeInput.toUpperCase()}' thành công vào ví D1!`,
      });
    } else {
      setActionBanner({
        type: "error",
        text: res.error || "Mã Gifcode không khả dụng.",
      });
    }
  };

  const handleUpgradeVip = async (tier: string) => {
    setIsDispatching(true);
    setActionBanner(null);
    const res = await onDispatch(
      "vip",
      { vipTier: tier },
      "Mini App React 19 UI (Tier 1)",
      currentUser.id
    );
    setIsDispatching(false);
    if (res.ok) {
      setActionBanner({
        type: "success",
        text: `Đã nâng cấp tài khoản @${currentUser.username} lên hạng ${tier}!`,
      });
    } else {
      setActionBanner({
        type: "error",
        text: res.error || "Không thể nâng cấp VIP.",
      });
    }
  };

  const handleOrderMxh = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setActionBanner(null);
    const res = await onDispatch(
      "dv_mxh",
      {
        platform: mxhPlatform,
        serviceName: mxhServiceName,
        targetUrl: mxhTargetUrl,
        quantity: mxhQuantity,
      },
      "Mini App React 19 UI (Tier 1)",
      currentUser.id
    );
    setIsDispatching(false);
    if (res.ok) {
      setActionBanner({
        type: "success",
        text: `Đã khởi tạo đơn dịch vụ MXH (${mxhQuantity.toLocaleString()} lượt) và đồng bộ sang SocialApi Tier 7!`,
      });
    } else {
      setActionBanner({
        type: "error",
        text: res.error || "Đặt đơn dịch vụ MXH thất bại.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Session Switcher Bar */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-sky-400" />
          <div className="text-xs">
            <span className="text-slate-400">Phiên Khách Hàng Đang Mô Phỏng (Session KV): </span>
            <span className="font-semibold text-slate-100">
              {currentUser.fullName} (@{currentUser.username})
            </span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="font-mono text-sky-400">{currentUser.role}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-amber-300">{currentUser.vipTier}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs font-mono tabular-nums">
            <span className="text-slate-400">Số Dư Ví D1: </span>
            <span className="text-emerald-400 font-semibold text-sm">
              {currentUser.balanceVnd.toLocaleString()} VND
            </span>
          </div>

          <select
            value={activeUserId}
            onChange={(e) => setActiveUserId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {state.d1Database.users.map((u) => (
              <option key={u.id} value={u.id}>
                Đổi User: @{u.username} ({u.vipTier})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionBanner && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border text-xs ${
            actionBanner.type === "success"
              ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
              : "bg-rose-950/40 border-rose-700/60 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button
            onClick={() => setActionBanner(null)}
            className="text-slate-400 hover:text-white px-2 whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Dual Pane: Left Telegram Bot Chat (BotUI) | Right Mini App React 19 UI (MiniAppUI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Telegram Bot Chat Webhook Client */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-lg flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-100">
              Telegram Bot Chat (Webhook Callbacks → Edge Dispatcher)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tương tác qua Telegram Bot API (Tier 7) định tuyến thẳng vào Cloudflare Worker Central Dispatcher.
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto bg-[#0B0F17]/60">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-sky-500 text-slate-950 font-medium"
                      : "bg-[#161F30] text-slate-100 border border-slate-800"
                  }`}
                >
                  <div>{msg.text}</div>
                  {msg.routeTag && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/60 font-mono text-[11px] text-sky-400">
                      {msg.routeTag}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 tabular-nums">
                  {msg.timestamp}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#111827]">
            <div className="text-[11px] text-slate-400">
              Inline Webhook Callback Buttons:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { cmd: "/shop_code", label: "🛍️ Shop Code" },
                { cmd: "/nap_tien", label: "💳 Nạp +500K" },
                { cmd: "/gifcode", label: "🎁 Gifcode" },
                { cmd: "/vip", label: "💎 Hạng VIP" },
              ].map((b) => (
                <button
                  key={b.cmd}
                  type="button"
                  disabled={isDispatching}
                  onClick={() => handleBotQuickCommand(b.cmd)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors whitespace-nowrap"
                >
                  {b.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendCustomChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Gõ lệnh /shop_code, /nap_tien, /gifcode..."
                className="flex-1 px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi
              </button>
            </form>
          </div>
        </div>

        {/* Right 7 Cols: Mini App React 19 UI (Core Services Tier 4) */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800/90 rounded-lg overflow-hidden flex flex-col">
          {/* Top Showcase Header with Generated Asset */}
          <div className="relative h-32 bg-slate-950 overflow-hidden border-b border-slate-800/80">
            <img
              src={miniappBanner}
              alt="CyberSub Mini App React 19 Infrastructure Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/50 to-transparent" />
            <div className="absolute bottom-3.5 inset-x-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Mini App React 19 UI — Trung Tâm Dịch Vụ Core (Tier 4)
                </h2>
                <p className="text-xs text-slate-300">
                  Kết nối REST / Auth API qua Cloudflare Worker Central Dispatcher với xác thực HMAC-SHA256.
                </p>
              </div>
            </div>
          </div>

          {/* 5 Core Service Navigation Tabs */}
          <div className="px-5 pt-3 border-b border-slate-800/80 flex flex-wrap items-center gap-1 bg-[#0B0F17]/50">
            {[
              { id: "shop_code", label: "Shop Code", icon: ShoppingBag },
              { id: "nap_tien", label: "VietQR Auto", icon: CreditCard },
              { id: "vip", label: "VIP & CSKH", icon: Crown },
              { id: "gifcode", label: "Gifcode", icon: Gift },
              { id: "dv_mxh", label: "Dịch Vụ MXH", icon: Share2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = miniAppTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    setMiniAppTab(
                      t.id as
                        | "shop_code"
                        | "nap_tien"
                        | "vip"
                        | "gifcode"
                        | "dv_mxh"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-sky-400 text-sky-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-5 flex-1">
            {/* TAB 1: SHOP CODE ENGINE */}
            {miniAppTab === "shop_code" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Route: <strong className="font-mono text-sky-400">shop_code</strong> · Tự động cấp License Key & link tải R2 sau khi thanh toán.
                  </span>
                  <span>
                    Ưu đãi hạng {currentUser.vipTier}:{" "}
                    {currentUser.vipTier === "VIP_DIAMOND"
                      ? "-15%"
                      : currentUser.vipTier === "VIP_GOLD"
                      ? "-8%"
                      : "0%"}
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800/90 rounded-lg bg-[#0B0F17]/50">
                  {state.d1Database.shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-100">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums">
                          Mã: {item.code} · {item.category} · {item.version} · Đã bán: {item.salesCount}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                          {item.storageKeyR2}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-sm font-mono font-semibold text-emerald-400 tabular-nums">
                          {item.priceVnd.toLocaleString()} VND
                        </div>
                        <button
                          onClick={() => handleBuyShopCode(item.id)}
                          disabled={isDispatching}
                          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded transition-colors whitespace-nowrap"
                        >
                          Mua & Nhận Key R2
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: VIETQR AUTO PAYMENT ENGINE */}
            {miniAppTab === "nap_tien" && (
              <form onSubmit={handleVietQrTopup} className="space-y-4 text-xs">
                <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-slate-900 border border-sky-500/40 flex flex-col items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-sky-400" />
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      VIETQR PRO
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold text-slate-100">
                      Cổng Nạp Tự Động VietQR 24/7 (Route: nap_tien)
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Hệ thống Banking Gateway (Tier 7) tự động bắn Webhook có chữ ký HMAC-SHA256 về Cloudflare Worker để cộng số dư ví D1 trong 3 giây.
                    </p>
                    <div className="font-mono text-sky-400">
                      Nội dung CK tự động: CYBER{currentUser.id.replace("usr_", "")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">
                      Ngân Hàng Nhận Đối Soát (Tier 7 BankApi)
                    </label>
                    <select
                      value={topupBank}
                      onChange={(e) => setTopupBank(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100"
                    >
                      <option value="MBBank">MBBank (Quân Đội - Auto 24/7)</option>
                      <option value="Vietcombank">Vietcombank (Digibank Webhook)</option>
                      <option value="Techcombank">Techcombank (FastPay API)</option>
                      <option value="ACB">ACB (Ngân Hàng Á Châu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5 font-medium">
                      Mệnh Giá Nạp (VND)
                    </label>
                    <select
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono tabular-nums text-emerald-400"
                    >
                      <option value={200000}>200,000 VND</option>
                      <option value={500000}>500,000 VND</option>
                      <option value={1500000}>1,500,000 VND</option>
                      <option value={5000000}>5,000,000 VND</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
                >
                  Kích Hoạt Webhook Đối Soát VietQR (+{topupAmount.toLocaleString()} VND)
                </button>
              </form>
            )}

            {/* TAB 3: VIP & CUSTOMER CARE CENTER */}
            {miniAppTab === "vip" && (
              <div className="space-y-4 text-xs">
                <div className="text-slate-400">
                  Route: <strong className="font-mono text-sky-400">vip / kh</strong> · Nâng cấp tài khoản để nhận chiết khấu tự động trên toàn bộ Shop Code và ưu tiên hàng đợi Vietsub AI.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-slate-400">Dành cho nhóm Subteam chuyên nghiệp</div>
                      <div className="text-base font-semibold text-amber-300">
                        Hạng VIP_GOLD
                      </div>
                      <div className="text-lg font-mono font-semibold text-slate-100 tabular-nums">
                        500,000 VND / năm
                      </div>
                      <div className="pt-2 space-y-1 text-slate-300">
                        <div>· Chiết khấu tự động 8% khi mua Shop Code</div>
                        <div>· Hàng đợi Whisper STT ưu tiên (Tối đa 2K)</div>
                        <div>· Lưu trữ phụ đề .ASS trên R2 90 ngày</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgradeVip("VIP_GOLD")}
                      disabled={isDispatching}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded transition-colors whitespace-nowrap"
                    >
                      Nâng Cấp VIP_GOLD
                    </button>
                  </div>

                  <div className="p-4 bg-[#0B0F17] border border-sky-500/60 rounded-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-sky-400">Dành cho Studio & Hệ thống phát hành</div>
                      <div className="text-base font-semibold text-sky-200">
                        Hạng VIP_DIAMOND
                      </div>
                      <div className="text-lg font-mono font-semibold text-slate-100 tabular-nums">
                        1,200,000 VND / năm
                      </div>
                      <div className="pt-2 space-y-1 text-slate-300">
                        <div>· Chiết khấu tự động 15% toàn bộ Shop Code & MXH</div>
                        <div>· Kết xuất FFmpeg NVENC 4K Hardsub không giới hạn</div>
                        <div>· Cấp quyền truy cập @cyber/vietsub-sdk Enterprise</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgradeVip("VIP_DIAMOND")}
                      disabled={isDispatching}
                      className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded transition-colors whitespace-nowrap"
                    >
                      Nâng Cấp VIP_DIAMOND
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GIFCODE ENGINE */}
            {miniAppTab === "gifcode" && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleRedeemGifcode} className="space-y-3">
                  <label className="block text-slate-300 font-medium">
                    Nhập Mã Quà Tặng Khuyến Mãi (Route: gifcode)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gifcodeInput}
                      onChange={(e) => setGifcodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isDispatching}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
                    >
                      Nhận Thưởng Vào Ví D1
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-[#0B0F17]/50">
                  {state.d1Database.gifcodes.map((g) => (
                    <div
                      key={g.code}
                      onClick={() => setGifcodeInput(g.code)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-semibold text-sky-400">
                          {g.code}
                        </span>
                        <span className="mx-2 text-slate-600">·</span>
                        <span className="text-slate-400">
                          Hạn dùng: {g.expiresAt}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-right">
                        <span className="text-emerald-400 font-semibold">
                          +{g.rewardVnd.toLocaleString()} VND
                        </span>
                        <span className="mx-2 text-slate-600">·</span>
                        <span className="text-slate-400">
                          Đã nhận: {g.usedCount}/{g.maxUses}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DỊCH VỤ MẠNG XÃ HỘI ENGINE */}
            {miniAppTab === "dv_mxh" && (
              <form onSubmit={handleOrderMxh} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Nền Tảng Phân Phối Video Vietsub
                    </label>
                    <select
                      value={mxhPlatform}
                      onChange={(e) => setMxhPlatform(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100"
                    >
                      <option value="YouTube Premiere">YouTube Premiere</option>
                      <option value="TikTok Reels">TikTok Reels 60fps</option>
                      <option value="Facebook Watch">Facebook Watch Subteam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Số Lượng Lượt Xem / Tương Tác
                    </label>
                    <input
                      type="number"
                      step={1000}
                      min={1000}
                      value={mxhQuantity}
                      onChange={(e) => setMxhQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono tabular-nums text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Gói Dịch Vụ Seeding (Tier 4 ModMXH → Tier 7 SocialApi)
                  </label>
                  <input
                    type="text"
                    value={mxhServiceName}
                    onChange={(e) => setMxhServiceName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Đường Dẫn Video Đích (URL)
                  </label>
                  <input
                    type="url"
                    value={mxhTargetUrl}
                    onChange={(e) => setMxhTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="font-mono tabular-nums text-slate-300">
                    Chi phí dự kiến:{" "}
                    <strong className="text-amber-300">
                      {(mxhQuantity * 32).toLocaleString()} VND
                    </strong>
                  </div>
                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
                  >
                    Khởi Tạo Đơn MXH Qua Edge Gateway
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
