import React, { useState } from "react";
import {
  PlatformState,
  ActiveWorkspaceTab,
  D1User,
} from "../types/platform";
import { RevenueDashboard } from "./Financials/RevenueDashboard.jsx";
import { UserTable } from "./UserManagement/UserTable.jsx";
import {
  Download,
  RefreshCw,
  AlertTriangle,
  Sliders,
  KeyRound,
  Plus,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface AdminPortalViewProps {
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
  onNavigateTab: (tab: ActiveWorkspaceTab) => void;
  onRefresh: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  state,
  onDispatch,
  onNavigateTab,
  onRefresh,
}) => {
  const [activeSubPanel, setActiveSubPanel] = useState<
    "finance" | "rbac" | "queue" | "hotreload"
  >("finance");

  const [rbacCallerId, setRbacCallerId] = useState<string>("usr_901");

  // Hot-Reload KV Config State
  const [kvKeyInput, setKvKeyInput] = useState<string>(
    "WASM_OCTOPUS_MEMORY_LIMIT_MB"
  );
  const [kvValueInput, setKvValueInput] = useState<string>("1024");
  const [kvDescInput, setKvDescInput] = useState<string>(
    "Giới hạn bộ nhớ WebAssembly Heap cho SubtitlesOctopus C++ Renderer"
  );

  // API Key Rotation State
  const [selectedKeyName, setSelectedKeyName] = useState<string>(
    "OPENAI_WHISPER_TRANSLATE_KEY"
  );
  const [newRawToken, setNewRawToken] = useState<string>(
    "sk-proj-cyber-vietsub-2026-live9981"
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "User",
      "Type",
      "Route",
      "Amount_VND",
      "Channel",
      "Reference",
      "Status",
      "Timestamp",
    ];
    const rows = state.d1Database.transactions.map((t) => [
      t.id,
      t.username,
      t.type,
      t.route,
      t.amountVnd,
      t.bankCode,
      t.referenceCode,
      t.status,
      t.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cybersub_d1_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedback({
      type: "success",
      message: `Đã xuất ${state.d1Database.transactions.length} bản ghi đối soát tài chính D1 ra file CSV.`,
    });
  };

  const handleTriggerTestVietQrTopup = async () => {
    setIsBusy(true);
    setFeedback(null);
    const res = await onDispatch(
      "nap_tien",
      { amountVnd: 1500000, bankCode: "MBBank" },
      "VietQR Auto Webhook IPN (Tier 7)",
      "usr_901"
    );
    setIsBusy(false);
    if (res.ok) {
      setFeedback({
        type: "success",
        message:
          "Đã mô phỏng Webhook VietQR (+1,500,000 VND) và cập nhật biểu đồ Recharts D1 thời gian thực.",
      });
    }
  };

  const handleUpdateUserRoleOrVip = async (
    targetUserId: string,
    newRole: string,
    newVipTier: string
  ) => {
    setFeedback(null);
    const res = await onDispatch(
      "admin_adjust_user",
      { targetUserId, newRole, newVipTier },
      "Admin Web Portal L1 (Tier 1)",
      rbacCallerId
    );
    if (res.ok) {
      setFeedback({
        type: "success",
        message: `Đã cập nhật UID ${targetUserId} → Role: ${newRole} · VIP: ${newVipTier}`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Bị từ chối bởi RBAC Auth Guard.",
      });
    }
  };

  const handleToggleUserStatus = async (user: D1User) => {
    setFeedback(null);
    const nextStatus = user.status === "Active" ? "Restricted" : "Active";
    const res = await onDispatch(
      "admin_adjust_user",
      { targetUserId: user.id, newStatus: nextStatus },
      "Admin Web Portal L1 (Tier 1)",
      rbacCallerId
    );
    if (res.ok) {
      setFeedback({
        type: "success",
        message: `Đã chuyển trạng thái UID ${user.id} (@${user.username}) sang ${nextStatus}.`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Bị từ chối bởi RBAC Auth Guard.",
      });
    }
  };

  const handleCreditWallet = async (
    targetUserId: string,
    deltaBalance: number
  ) => {
    setFeedback(null);
    const res = await onDispatch(
      "admin_adjust_user",
      { targetUserId, deltaBalance },
      "Admin Web Portal L1 (Tier 1)",
      rbacCallerId
    );
    if (res.ok) {
      setFeedback({
        type: "success",
        message: `Đã điều chỉnh số dư ví D1 cho UID ${targetUserId} (${
          deltaBalance >= 0 ? "+" : ""
        }${deltaBalance.toLocaleString()} VND).`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Bị từ chối bởi RBAC Auth Guard.",
      });
    }
  };

  const handleHotReloadKv = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setFeedback(null);
    const res = await onDispatch(
      "admin_hot_reload",
      {
        key: kvKeyInput.trim().toUpperCase(),
        value: kvValueInput.trim(),
        description: kvDescInput.trim(),
      },
      "Admin Web Portal L1 (Tier 1)",
      rbacCallerId
    );
    setIsBusy(false);
    if (res.ok) {
      setFeedback({
        type: "success",
        message: `Hot-Reload thành công khoá '${kvKeyInput.toUpperCase()}' vào Cloudflare KV (CONFIG_KV).`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Không thể ghi vào CONFIG_KV.",
      });
    }
  };

  const handleRotateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setFeedback(null);
    const res = await onDispatch(
      "admin_rotate_key",
      {
        keyName: selectedKeyName,
        rawSecret: newRawToken,
      },
      "Admin Web Portal L1 (Tier 1)",
      rbacCallerId
    );
    setIsBusy(false);
    if (res.ok) {
      setFeedback({
        type: "success",
        message: `Đã xác thực & đồng bộ khoá '${selectedKeyName}' vào API_KEYS_KV và Edge Worker.`,
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Xác thực API Key thất bại.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Metrics Strip */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
          <div className="p-5">
            <div className="text-xs text-slate-400">
              Tổng Thu Đối Soát VietQR & Gifcode (D1)
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400 font-mono tabular-nums">
              +{state.metrics.totalRevenueVnd.toLocaleString()} VND
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Route: nap_tien · gifcode · Tự động đối soát 24/7
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs text-slate-400">
              Doanh Số Dịch Vụ Core (Shop Code, VIP, MXH)
            </div>
            <div className="mt-2 text-2xl font-semibold text-sky-400 font-mono tabular-nums">
              {state.metrics.totalPurchasesVnd.toLocaleString()} VND
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Route: shop_code · vip · dv_mxh · Thanh toán ví D1
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs text-slate-400">
              Tài Khoản Định Danh & Phiên KV Hoạt Động
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100 font-mono tabular-nums">
              {state.metrics.activeUsers} Users ·{" "}
              {state.kvStore.sessions.length} Sessions
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Bảo vệ bởi HMAC-SHA256 & RBAC Auth Guard
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs text-slate-400">
              Tiến Trình Vietsub AI & Kho Lưu Trữ R2
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-400 font-mono tabular-nums">
              {state.metrics.queueJobsCount} Jobs · {state.metrics.r2StorageMb}{" "}
              MB
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Whisper STT · Gemini/GPT-4o · SubtitlesOctopus WASM
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation bar for the 4 L1 Admin Portal Modules */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#111827] p-1 rounded-lg border border-slate-800/90">
          <button
            onClick={() => setActiveSubPanel("finance")}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubPanel === "finance"
                ? "bg-sky-500 text-slate-950 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            01. RevenueDashboard.jsx (Recharts D1)
          </button>
          <button
            onClick={() => setActiveSubPanel("rbac")}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubPanel === "rbac"
                ? "bg-sky-500 text-slate-950 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            02. UserTable.jsx (RBAC & Quick-Toggle)
          </button>
          <button
            onClick={() => setActiveSubPanel("queue")}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubPanel === "queue"
                ? "bg-sky-500 text-slate-950 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            03. Vietsub AI Queue Control
          </button>
          <button
            onClick={() => setActiveSubPanel("hotreload")}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeSubPanel === "hotreload"
                ? "bg-sky-500 text-slate-950 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            04. Hot-Reload Config & Key Manager
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới D1 / KV
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Sổ Cái CSV
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border text-xs ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
              : "bg-rose-950/40 border-rose-700/60 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {/* PANEL 01: Financials/RevenueDashboard.jsx */}
      {activeSubPanel === "finance" && (
        <RevenueDashboard
          transactions={state.d1Database.transactions}
          onExportCsv={handleExportCsv}
          onTriggerTestTopup={handleTriggerTestVietQrTopup}
        />
      )}

      {/* PANEL 02: UserManagement/UserTable.jsx */}
      {activeSubPanel === "rbac" && (
        <UserTable
          users={state.d1Database.users}
          callerId={rbacCallerId}
          onChangeCallerId={setRbacCallerId}
          onUpdateUserRole={handleUpdateUserRoleOrVip}
          onCycleVipTier={handleUpdateUserRoleOrVip}
          onToggleUserStatus={handleToggleUserStatus}
          onCreditWallet={handleCreditWallet}
        />
      )}

      {/* PANEL 03: VIETSUB AI QUEUE CONTROL */}
      {activeSubPanel === "queue" && (
        <div className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                03. Hàng Đợi Xử Lý Phụ Đề AI & Kết Xuất FFmpeg / WASM (Tier 5)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý luồng Whisper STT → Gemini/GPT-4o Translation → SubtitlesOctopus WASM & FFmpeg Hardsub R2.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("studio")}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap"
            >
              Mở Vietsub WASM Studio
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                  <th className="py-3 px-4 font-medium">Job ID & Tệp Video</th>
                  <th className="py-3 px-4 font-medium">Ngôn Ngữ & Mô Hình AI</th>
                  <th className="py-3 px-4 font-medium">Cơ Chế Render</th>
                  <th className="py-3 px-4 font-medium">Đường Dẫn R2 Output</th>
                  <th className="py-3 px-4 font-medium text-right">Tiến Độ</th>
                  <th className="py-3 px-4 font-medium text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {state.d1Database.vietsubQueue.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-100">
                        {job.title}
                      </div>
                      <div className="text-slate-400 font-mono tabular-nums mt-0.5">
                        {job.id} · @{job.submittedBy} · {job.updatedAt}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-mono text-sky-400">
                        {job.sourceLang} → {job.targetLang}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {job.sttEngine} · {job.translateEngine}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {job.renderMode}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <div className="truncate max-w-xs">{job.r2OutputKey}</div>
                      <div className="truncate max-w-xs text-slate-500 mt-0.5">
                        {job.assFileKey}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          job.progress === 100
                            ? "text-emerald-400 font-semibold"
                            : "text-amber-300 font-semibold"
                        }
                      >
                        {job.progress}% · {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab("studio")}
                        className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
                      >
                        Nạp vào WASM Studio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 04: HOT-RELOAD CONFIG & KEY MANAGER */}
      {activeSubPanel === "hotreload" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
            <div className="p-5">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                04. Cloudflare KV Hot-Reload Config (Namespace: CONFIG_KV)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Thay đổi tham số vận hành hệ thống tức thời mà không cần build hay khởi động lại Worker.
              </p>
            </div>

            <div className="divide-y divide-slate-800/60">
              {state.kvStore.config.map((cfg) => (
                <div
                  key={cfg.key}
                  onClick={() => {
                    setKvKeyInput(cfg.key);
                    setKvValueInput(cfg.value);
                    setKvDescInput(cfg.description);
                  }}
                  className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-mono font-semibold text-sky-400">
                      {cfg.key}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {cfg.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-semibold text-emerald-400 tabular-nums">
                      {cfg.value}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                      {cfg.updatedAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleHotReloadKv}
              className="p-5 space-y-3 text-xs bg-[#0B0F17]/40"
            >
              <div className="font-semibold text-slate-200">
                Cập Nhật / Thêm Biến Cấu Hình Động (Route: admin_hot_reload)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Khoá KV (Key)
                  </label>
                  <input
                    type="text"
                    value={kvKeyInput}
                    onChange={(e) => setKvKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Giá Trị Mới (Value)
                  </label>
                  <input
                    type="text"
                    value={kvValueInput}
                    onChange={(e) => setKvValueInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Mô Tả Ngữ Cảnh
                </label>
                <input
                  type="text"
                  value={kvDescInput}
                  onChange={(e) => setKvDescInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Ghi Tức Thời Vào CONFIG_KV
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
            <div className="p-5">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Auto-Validate & Save API Keys (API_KEYS_KV)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Đồng bộ Secret Token kết nối tới các hệ thống ngoại vi Tier 7 (Telegram, VietQR, Whisper/GPT, MXH).
              </p>
            </div>

            <div className="divide-y divide-slate-800/60">
              {state.kvStore.apiKeys.map((k) => (
                <div
                  key={k.keyName}
                  onClick={() => setSelectedKeyName(k.keyName)}
                  className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {k.keyName}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {k.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-slate-400">
                    {k.maskedValue}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {k.provider} · Xoay vòng: {k.lastRotated}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleRotateApiKey}
              className="p-5 space-y-3 text-xs bg-[#0B0F17]/40"
            >
              <div className="font-semibold text-slate-200">
                Xoay Vòng & Kiểm Tra Kết Nối Secret Mới
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Chọn Định Danh Khoá
                </label>
                <select
                  value={selectedKeyName}
                  onChange={(e) => setSelectedKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {state.kvStore.apiKeys.map((k) => (
                    <option key={k.keyName} value={k.keyName}>
                      {k.keyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Chuỗi Token Mới (Tự động che dấu sau khi lưu vào KV)
                </label>
                <input
                  type="text"
                  value={newRawToken}
                  onChange={(e) => setNewRawToken(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                Auto-Validate & Đồng Bộ API_KEYS_KV
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
