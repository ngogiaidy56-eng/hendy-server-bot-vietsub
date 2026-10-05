import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Download,
  Search,
  Database,
  ArrowUpRight,
} from "lucide-react";

const BASE_MONTHLY_D1_TRENDS = [
  {
    month: "05/2026",
    vietqrTopup: 42500000,
    shopCodeSales: 18400000,
    vipSubscriptions: 9600000,
    mxhServices: 6200000,
    txCount: 312,
  },
  {
    month: "06/2026",
    vietqrTopup: 51800000,
    shopCodeSales: 22900000,
    vipSubscriptions: 12000000,
    mxhServices: 7850000,
    txCount: 389,
  },
  {
    month: "07/2026",
    vietqrTopup: 64200000,
    shopCodeSales: 29500000,
    vipSubscriptions: 15600000,
    mxhServices: 9400000,
    txCount: 465,
  },
  {
    month: "08/2026",
    vietqrTopup: 78900000,
    shopCodeSales: 35100000,
    vipSubscriptions: 19200000,
    mxhServices: 11800000,
    txCount: 540,
  },
  {
    month: "09/2026",
    vietqrTopup: 94600000,
    shopCodeSales: 43800000,
    vipSubscriptions: 24000000,
    mxhServices: 14900000,
    txCount: 672,
  },
  {
    month: "10/2026",
    vietqrTopup: 112400000,
    shopCodeSales: 52600000,
    vipSubscriptions: 28800000,
    mxhServices: 18200000,
    txCount: 794,
  },
];

function formatVndCompact(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(value);
}

/**
 * apps/admin-portal/src/components/Financials/RevenueDashboard.jsx
 * Data-heavy Financial & Monthly D1 SQLite Revenue Stream Dashboard using Recharts
 */
export function RevenueDashboard({
  transactions = [],
  onExportCsv,
  onTriggerTestTopup,
}) {
  const [chartMode, setChartMode] = useState("area");
  const [routeFilter, setRouteFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const monthlyData = useMemo(() => {
    const liveVietQr = transactions
      .filter((t) => t.route === "nap_tien" && t.amountVnd > 0)
      .reduce((acc, t) => acc + t.amountVnd, 0);

    const liveShop = transactions
      .filter((t) => t.route === "shop_code")
      .reduce((acc, t) => acc + Math.abs(t.amountVnd), 0);

    const liveVip = transactions
      .filter((t) => t.route === "vip")
      .reduce((acc, t) => acc + Math.abs(t.amountVnd), 0);

    const liveMxh = transactions
      .filter((t) => t.route === "dv_mxh")
      .reduce((acc, t) => acc + Math.abs(t.amountVnd), 0);

    return BASE_MONTHLY_D1_TRENDS.map((row, index) => {
      if (index === BASE_MONTHLY_D1_TRENDS.length - 1) {
        const vietqrTopup = row.vietqrTopup + liveVietQr;
        const shopCodeSales = row.shopCodeSales + liveShop;
        const vipSubscriptions = row.vipSubscriptions + liveVip;
        const mxhServices = row.mxhServices + liveMxh;
        return {
          ...row,
          vietqrTopup,
          shopCodeSales,
          vipSubscriptions,
          mxhServices,
          totalNetVolume:
            vietqrTopup + shopCodeSales + vipSubscriptions + mxhServices,
          txCount: row.txCount + transactions.length,
        };
      }
      return {
        ...row,
        totalNetVolume:
          row.vietqrTopup +
          row.shopCodeSales +
          row.vipSubscriptions +
          row.mxhServices,
      };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesRoute = routeFilter === "all" || t.route === routeFilter;
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.referenceCode.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q);
      return matchesRoute && matchesSearch;
    });
  }, [transactions, routeFilter, searchQuery]);

  const latestMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const momGrowthPercent = (
    ((latestMonth.totalNetVolume - prevMonth.totalNetVolume) /
      prevMonth.totalNetVolume) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <section className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              01. Biểu Đồ Dòng Tiền & Xu Hướng Doanh Thu D1 SQLite (RevenueDashboard.jsx)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tổng hợp dữ liệu thời gian thực từ bảng <span className="font-mono text-sky-400">transactions</span> trên Cloudflare D1 theo 4 luồng dịch vụ Core Tier 4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-md border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setChartMode("area")}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  chartMode === "area"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Area Trend
              </button>
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  chartMode === "bar"
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Stacked Bar
              </button>
            </div>

            {onTriggerTestTopup && (
              <button
                type="button"
                onClick={onTriggerTestTopup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors whitespace-nowrap"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Mô Phỏng Webhook VietQR (+1.5M)
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 bg-[#0B0F17]/40">
          <div className="p-4">
            <div className="text-xs text-slate-400">
              Tổng Quy Mô Giao Dịch (10/2026)
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-white tabular-nums">
              {latestMonth.totalNetVolume.toLocaleString()} VND
            </div>
            <div className="mt-0.5 text-xs font-mono text-emerald-400 tabular-nums">
              +{momGrowthPercent}% so với 09/2026 ({latestMonth.txCount} GD)
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-400">
              Nạp Tự Động VietQR (Route: nap_tien)
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-emerald-400 tabular-nums">
              {latestMonth.vietqrTopup.toLocaleString()} VND
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              MBBank · Vietcombank · Techcombank IPN
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-400">
              Doanh Thu Shop Code (Route: shop_code)
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-sky-400 tabular-nums">
              {latestMonth.shopCodeSales.toLocaleString()} VND
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              WASM SDK · Worker Templates · Hardsub Kit
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-400">
              Gói VIP & Dịch Vụ MXH (Route: vip · dv_mxh)
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-amber-300 tabular-nums">
              {(
                latestMonth.vipSubscriptions + latestMonth.mxhServices
              ).toLocaleString()}{" "}
              VND
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              VIP Diamond/Gold · YouTube/TikTok Seeding
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "area" ? (
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickFormatter={formatVndCompact}
                  />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="vietqrTopup"
                    name="VietQR Auto Top-up"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="shopCodeSales"
                    name="Shop Code Engine"
                    stroke="#38BDF8"
                    fill="#38BDF8"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="vipSubscriptions"
                    name="VIP Subscriptions"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickFormatter={formatVndCompact}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="vietqrTopup"
                    name="VietQR Auto Top-up"
                    stackId="a"
                    fill="#10B981"
                  />
                  <Bar
                    dataKey="shopCodeSales"
                    name="Shop Code Engine"
                    stackId="a"
                    fill="#38BDF8"
                  />
                  <Bar
                    dataKey="vipSubscriptions"
                    name="VIP Subscriptions"
                    stackId="a"
                    fill="#F59E0B"
                  />
                  <Bar
                    dataKey="mxhServices"
                    name="Dịch Vụ MXH"
                    stackId="a"
                    fill="#A855F7"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Sổ Cái Giao Dịch Chi Tiết (Cloudflare D1 SQLite Ledger)
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã GD, username..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100"
              />
            </div>

            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/50">
                <th className="py-3 px-4 font-medium">Mã GD</th>
                <th className="py-3 px-4 font-medium">Tài Khoản</th>
                <th className="py-3 px-4 font-medium">Phân Loại & Route</th>
                <th className="py-3 px-4 font-medium">Kênh / Mã Tham Chiếu</th>
                <th className="py-3 px-4 font-medium text-right">Biến Động Số Dư</th>
                <th className="py-3 px-4 font-medium">Trạng Thái</th>
                <th className="py-3 px-4 font-medium text-right">Thời Gian (D1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                    {txn.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-100">
                    @{txn.username}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {txn.type} · <span className="font-mono text-sky-400">{txn.route}</span>
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                    {txn.bankCode} / {txn.referenceCode}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      txn.amountVnd >= 0 ? "text-emerald-400" : "text-amber-300"
                    }`}
                  >
                    {txn.amountVnd >= 0 ? "+" : ""}
                    {txn.amountVnd.toLocaleString()} VND
                  </td>
                  <td className="py-3 px-4 text-emerald-400">{txn.status}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                    {txn.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default RevenueDashboard;
