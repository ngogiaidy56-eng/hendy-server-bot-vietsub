import React, { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  ArrowUpDown,
  Wallet,
} from "lucide-react";

const ROLE_SEQUENCE = ["MEMBER", "EDITOR_PRO", "SUPER_ADMIN"];
const VIP_SEQUENCE = ["STANDARD", "VIP_SILVER", "VIP_GOLD", "VIP_DIAMOND"];

/**
 * src/components/UserManagement/UserTable.jsx
 * Searchable RBAC User Management Table with UID, Status, VIP Tier & Quick-Action Role Toggles
 * @param {{
 *   users?: Array<any>,
 *   onUpdateUserRole?: (uid: string, role: string, vipTier: string) => Promise<void> | void,
 *   onToggleUserStatus?: (user: any) => Promise<void> | void,
 *   onCycleVipTier?: (uid: string, role: string, vipTier: string) => Promise<void> | void,
 *   onCreditWallet?: (uid: string, delta: number) => Promise<void> | void,
 *   callerId?: string,
 *   onChangeCallerId?: (callerId: string) => void
 * }} props
 */
export function UserTable({
  users = [],
  onUpdateUserRole,
  onToggleUserStatus,
  onCycleVipTier,
  onCreditWallet,
  callerId = "usr_901",
  onChangeCallerId,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState("balanceVnd");
  const [sortAsc, setSortAsc] = useState(false);
  const [pendingUid, setPendingUid] = useState(null);

  const filteredAndSortedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users
      .filter((u) => {
        const matchesQuery =
          !q ||
          String(u.id).toLowerCase().includes(q) ||
          String(u.telegramId).toLowerCase().includes(q) ||
          String(u.username).toLowerCase().includes(q) ||
          String(u.fullName).toLowerCase().includes(q);
        const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
        const matchesStatus =
          statusFilter === "ALL" || u.status === statusFilter;
        return matchesQuery && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleQuickRoleCycle = async (user) => {
    const currentIndex = ROLE_SEQUENCE.indexOf(user.role);
    const nextRole =
      ROLE_SEQUENCE[(currentIndex + 1) % ROLE_SEQUENCE.length];
    setPendingUid(user.id);
    try {
      await onUpdateUserRole?.(user.id, nextRole, user.vipTier);
    } finally {
      setPendingUid(null);
    }
  };

  const handleDirectRoleSelect = async (user, newRole) => {
    setPendingUid(user.id);
    try {
      await onUpdateUserRole?.(user.id, newRole, user.vipTier);
    } finally {
      setPendingUid(null);
    }
  };

  const handleQuickVipCycle = async (user) => {
    const currentIndex = VIP_SEQUENCE.indexOf(user.vipTier);
    const nextVip = VIP_SEQUENCE[(currentIndex + 1) % VIP_SEQUENCE.length];
    setPendingUid(user.id);
    try {
      await onCycleVipTier?.(user.id, user.role, nextVip);
    } finally {
      setPendingUid(null);
    }
  };

  const handleQuickWalletTopup = async (user, delta) => {
    setPendingUid(user.id);
    try {
      await onCreditWallet?.(user.id, delta);
    } finally {
      setPendingUid(null);
    }
  };

  return (
    <section className="bg-[#111827] border border-slate-800/90 rounded-lg divide-y divide-slate-800/80">
      {/* Header & RBAC Context Bar */}
      <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            02. Quản Lý Tài Khoản, Ví D1 & Phân Quyền RBAC (UserManagement/UserTable.jsx)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu theo UID, Telegram ID, trạng thái hoạt động, hạng VIP và chuyển đổi nhanh quyền hạn RBAC qua Edge Gateway Tier 3.
          </p>
        </div>

        {onChangeCallerId && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 whitespace-nowrap">
              Phiên Thực Thi RBAC:
            </span>
            <select
              value={callerId}
              onChange={(e) => onChangeCallerId(e.target.value)}
              className="px-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="usr_901">
                UID: usr_901 (SUPER_ADMIN — Full Access)
              </option>
              <option value="usr_903">
                UID: usr_903 (MEMBER — Test 403 RBAC Guard)
              </option>
            </select>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="px-5 py-3.5 bg-[#0B0F17]/40 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo UID (usr_901), Telegram ID, @username, họ tên..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-md border border-slate-800">
            {["ALL", "SUPER_ADMIN", "EDITOR_PRO", "MEMBER"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-mono ${
                  roleFilter === r
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === "ALL" ? "Tất cả Role" : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-md border border-slate-800">
            {["ALL", "Active", "Restricted"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-800 text-sky-400 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st === "ALL" ? "Mọi Trạng Thái" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0B0F17]/60">
              <th className="py-3 px-4 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center gap-1 hover:text-slate-200 whitespace-nowrap"
                >
                  UID / Telegram ID
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">Người Dùng Hệ Thống</th>
              <th className="py-3 px-4 font-medium">Trạng Thái (Status)</th>
              <th className="py-3 px-4 font-medium">Hạng VIP (VIP Tier)</th>
              <th className="py-3 px-4 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort("balanceVnd")}
                  className="inline-flex items-center gap-1 hover:text-slate-200 whitespace-nowrap ml-auto"
                >
                  Số Dư Ví D1
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">
                Quyền RBAC & Quick-Action Toggle
              </th>
              <th className="py-3 px-4 font-medium text-right">
                Thao Tác Nhanh Ví
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Không tìm thấy người dùng khớp bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => {
                const isRowBusy = pendingUid === user.id;
                const isActive = user.status === "Active";

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="text-sky-400 font-semibold">{user.id}</div>
                      <div className="text-slate-500 mt-0.5">
                        TG: {user.telegramId}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">
                        {user.fullName}
                      </div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        @{user.username} · Cập nhật: {user.updatedAt.slice(11, 19)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={isRowBusy}
                        onClick={() => onToggleUserStatus?.(user)}
                        className="inline-flex items-center gap-1.5 text-left hover:underline disabled:opacity-50 whitespace-nowrap"
                        title="Nhấn để chuyển trạng thái Active / Restricted"
                      >
                        {isActive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-medium">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-amber-400 font-medium">
                              Restricted
                            </span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-300 font-medium">
                          {user.vipTier}
                        </span>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleQuickVipCycle(user)}
                          className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors whitespace-nowrap"
                        >
                          Đổi VIP
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="text-emerald-400 font-semibold">
                        {user.balanceVnd.toLocaleString()} VND
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Chi: {user.totalSpentVnd.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          disabled={isRowBusy}
                          onChange={(e) =>
                            handleDirectRoleSelect(user, e.target.value)
                          }
                          className="px-2.5 py-1 bg-[#0B0F17] border border-slate-700 rounded font-mono text-xs text-sky-300 focus:outline-none focus:border-sky-500"
                        >
                          {ROLE_SEQUENCE.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleQuickRoleCycle(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 rounded font-medium transition-colors whitespace-nowrap"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              isRowBusy ? "animate-spin" : ""
                            }`}
                          />
                          Toggle Role
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleQuickWalletTopup(user, 500000)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded transition-colors whitespace-nowrap"
                        >
                          <Wallet className="w-3 h-3" />
                          +500K
                        </button>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleQuickWalletTopup(user, -200000)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors whitespace-nowrap"
                        >
                          -200K
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default UserTable;
