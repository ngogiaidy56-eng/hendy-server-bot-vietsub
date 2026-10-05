import React, { useState } from "react";
import { PlatformState } from "../types/platform";
import {
  GitBranch,
  Cpu,
  Shield,
  Database,
  HardDrive,
  Copy,
  Plus,
  CheckCircle2,
} from "lucide-react";

interface EdgeDevOpsDataViewProps {
  state: PlatformState;
  onRefreshState: () => void;
}

export const EdgeDevOpsDataView: React.FC<EdgeDevOpsDataViewProps> = ({
  state,
  onRefreshState,
}) => {
  const [bindingName, setBindingName] = useState<string>("SUBTITLE_CACHE_KV");
  const [resourceType, setResourceType] = useState<string>(
    "Cloudflare KV Namespace"
  );
  const [targetTier, setTargetTier] = useState<string>(
    "Tier 6 -> Tier 3 Dispatcher & Tier 5 WASM"
  );
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [copiedWrangler, setCopiedWrangler] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [storageTab, setStorageTab] = useState<"d1" | "kv_sessions" | "r2">(
    "r2"
  );

  const handleProvisionBinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindingName.trim()) return;
    setIsProvisioning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/devops/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bindingName,
          resourceType,
          targetTier,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotice(
          `GitHub Actions Auto-Bindings đã khởi tạo & gắn kết '${data.binding.bindingName}' (${data.binding.resourceId}) vào Cloudflare Worker.`
        );
        setBindingName("");
        onRefreshState();
      }
    } finally {
      setIsProvisioning(false);
    }
  };

  const wranglerToml = `name = "cybersub-edge-dispatcher"
main = "src/worker/dispatcher.ts"
compatibility_date = "2026-10-01"

# Auto-Provisioned Bindings (Tier 2 -> Tier 6)
${state.devopsBindings
  .map(
    (b) =>
      `# ${b.resourceType} (${b.targetTier})\n# binding = "${b.bindingName}" | id = "${b.resourceId}"`
  )
  .join("\n")}`;

  const handleCopyWrangler = () => {
    navigator.clipboard.writeText(wranglerToml);
    setCopiedWrangler(true);
    setTimeout(() => setCopiedWrangler(false), 2000);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white px-2 whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TIER 2: DEVOPS AUTOMATION & AUTO-BINDINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
          <div className="p-5">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-400" />
              Tầng 2: DevOps Automation & Auto-Bindings Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              GitHub Monorepo → GitHub Actions CI/CD → Tự động cấp phát D1, KV, R2 & Dual Build Matrix (Workers & Pages).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                  <th className="py-2.5 px-4 font-medium">Tên Binding</th>
                  <th className="py-2.5 px-4 font-medium">Loại Tài Nguyên Cloudflare</th>
                  <th className="py-2.5 px-4 font-medium">Resource ID</th>
                  <th className="py-2.5 px-4 font-medium">Luồng Liên Kết</th>
                  <th className="py-2.5 px-4 font-medium text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {state.devopsBindings.map((b) => (
                  <tr key={b.resourceId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-400">
                      {b.bindingName}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{b.resourceType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {b.resourceId}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{b.targetTier}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {b.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleProvisionBinding}
            className="p-5 bg-[#0B0F17]/40 space-y-3 text-xs"
          >
            <div className="font-semibold text-slate-200">
              Auto-Provision Tài Nguyên Cloudflare Mới (D1 / KV / R2 / Service Binding)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={bindingName}
                onChange={(e) => setBindingName(e.target.value)}
                placeholder="VD: SUBTITLE_CACHE_KV"
                className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md font-mono text-slate-100"
              />
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100"
              >
                <option value="Cloudflare D1 (SQLite)">
                  Cloudflare D1 (SQLite)
                </option>
                <option value="Cloudflare KV Namespace">
                  Cloudflare KV Namespace
                </option>
                <option value="Cloudflare R2 Bucket">
                  Cloudflare R2 Bucket
                </option>
                <option value="Cloudflare Service Binding">
                  Cloudflare Service Binding
                </option>
              </select>
              <button
                type="submit"
                disabled={isProvisioning}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-md transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Auto-Provision & Bind
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Cols: Generated wrangler.toml & Dual Build Matrix */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800/90 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Cấu Hình wrangler.toml Sinh Tự Động
              </h3>
              <button
                onClick={handleCopyWrangler}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 rounded transition-colors whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedWrangler ? "Đã chép!" : "Sao chép"}
              </button>
            </div>
            <pre className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-md text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {wranglerToml}
            </pre>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">
              Dual Build Matrix (Workers & Pages Assets)
            </div>
            <div className="text-slate-400">
              · Target 1 (Deploy Workers): Cloudflare Worker Central Dispatcher + Core Services Tier 4
            </div>
            <div className="text-slate-400">
              · Target 2 (Deploy Pages): Admin Web Portal L1 + Vietsub WASM Studio + Mini App React 19 UI
            </div>
          </div>
        </div>
      </div>

      {/* TIER 3: EDGE GATEWAY CENTRAL DISPATCHER & HMAC-SHA256 LOGS */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Tầng 3: Trạm Trung Gian Điều Phối (Cloudflare Worker Central Dispatcher)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Mọi tương tác từ BotUI, MiniAppUI, AdminPortal và WASMStudio đều được xác thực chữ ký HMAC-SHA256 & RBAC trước khi định tuyến.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                <th className="py-2.5 px-4 font-medium">Thời Gian</th>
                <th className="py-2.5 px-4 font-medium">Client Nguồn (Tier 1/2)</th>
                <th className="py-2.5 px-4 font-medium">Route & Mô-đun Đích</th>
                <th className="py-2.5 px-4 font-medium">Chữ Ký HMAC-SHA256 & RBAC</th>
                <th className="py-2.5 px-4 font-medium">Chi Tiết Điều Phối</th>
                <th className="py-2.5 px-4 font-medium text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {state.gatewayLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {log.sourceClient}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sky-400">{log.route}</span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {log.targetEngine}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    <div>{log.hmacSignature}</div>
                    <div className="text-[11px] text-amber-300 mt-0.5">
                      Role: {log.rbacRole} · {log.latencyMs}ms
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.summary}</td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${
                      log.status === "200 OK"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIER 6: CLOUDFLARE D1, KV SESSIONS & R2 STORAGE EXPLORER */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Tầng 6: Tầng Dữ Liệu & Lưu Trữ Cloudflare (D1 SQLite · KV Session · R2 Media)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kiểm tra trực tiếp các đối tượng media `.mp4` / `.ass` trong R2, phiên người dùng trong KV và đơn hàng MXH trong D1.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-md border border-slate-800">
            <button
              onClick={() => setStorageTab("r2")}
              className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                storageTab === "r2"
                  ? "bg-sky-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Cloudflare R2 (Media Storage)
            </button>
            <button
              onClick={() => setStorageTab("kv_sessions")}
              className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                storageTab === "kv_sessions"
                  ? "bg-sky-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Cloudflare KV (Session Manager)
            </button>
            <button
              onClick={() => setStorageTab("d1")}
              className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                storageTab === "d1"
                  ? "bg-sky-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Cloudflare D1 (MXH Orders)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {storageTab === "r2" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                  <th className="py-2.5 px-4 font-medium">Object Key (R2)</th>
                  <th className="py-2.5 px-4 font-medium">Bucket</th>
                  <th className="py-2.5 px-4 font-medium">MIME Type</th>
                  <th className="py-2.5 px-4 font-medium">Phân Hệ Ghi Dữ Liệu</th>
                  <th className="py-2.5 px-4 font-medium text-right">Dung Lượng</th>
                  <th className="py-2.5 px-4 font-medium text-right">Cập Nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {state.r2Objects.map((obj) => (
                  <tr key={obj.key} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-sky-400 flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{obj.key}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {obj.bucket}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {obj.contentType}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{obj.tierOrigin}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {obj.sizeMb} MB
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                      {obj.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {storageTab === "kv_sessions" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                  <th className="py-2.5 px-4 font-medium">Session Key (KV)</th>
                  <th className="py-2.5 px-4 font-medium">Tài Khoản</th>
                  <th className="py-2.5 px-4 font-medium">Kênh Kết Nối</th>
                  <th className="py-2.5 px-4 font-medium">Route Gần Nhất</th>
                  <th className="py-2.5 px-4 font-medium text-right">TTL (Giây)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Xác Thực HMAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {state.kvStore.sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-sky-400">
                      {s.sessionId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100">
                      @{s.username}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.clientChannel}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">
                      {s.activeRoute}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {s.ttlSeconds}s
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {s.hmacVerified ? "Verified" : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {storageTab === "d1" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                  <th className="py-2.5 px-4 font-medium">Order ID</th>
                  <th className="py-2.5 px-4 font-medium">Nền Tảng</th>
                  <th className="py-2.5 px-4 font-medium">Gói Dịch Vụ MXH</th>
                  <th className="py-2.5 px-4 font-medium">URL Video Đích</th>
                  <th className="py-2.5 px-4 font-medium text-right">Số Lượng</th>
                  <th className="py-2.5 px-4 font-medium text-right">Thanh Toán D1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {state.d1Database.mxhOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-sky-400">{o.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {o.platform}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{o.serviceName}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 truncate max-w-xs">
                      {o.targetUrl}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                      {o.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {o.priceVnd.toLocaleString()} VND · {o.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
