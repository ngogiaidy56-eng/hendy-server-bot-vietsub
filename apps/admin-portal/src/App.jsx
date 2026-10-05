import React from "react";
import { useEdgeRealtime } from "./hooks/useEdgeRealtime.js";
import { RevenueDashboard } from "./components/Financials/RevenueDashboard.jsx";
import { UserTable } from "./components/UserManagement/UserTable.jsx";
import { QueueController } from "./components/VietsubQueue/QueueController.jsx";
import { KvHotReloadManager } from "./components/ConfigMaintenance/KvHotReloadManager.jsx";

export default function App() {
  const { state, loading, refresh } = useEdgeRealtime("/api/state");

  if (loading || !state) {
    return (
      <div className="p-8 text-xs font-mono text-slate-300">
        Loading Admin Portal L1...
      </div>
    );
  }

  const handleDispatchAdmin = async (route, payload) => {
    await fetch("/api/gateway/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceClient: "Admin Web Portal L1 (Tier 1)",
        route,
        userId: "usr_901",
        payload,
      }),
    });
    await refresh();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white">
          Hendy Admin Web Portal L1 (Cyberpunk Dark UI)
        </h1>
      </header>
      <RevenueDashboard transactions={state.d1Database?.transactions} />
      <UserTable
        users={state.d1Database?.users}
        onUpdateUserRole={(targetUserId, newRole, newVipTier) =>
          handleDispatchAdmin("admin_adjust_user", {
            targetUserId,
            newRole,
            newVipTier,
          })
        }
        onCycleVipTier={(targetUserId, newRole, newVipTier) =>
          handleDispatchAdmin("admin_adjust_user", {
            targetUserId,
            newRole,
            newVipTier,
          })
        }
        onCreditWallet={(targetUserId, deltaBalance) =>
          handleDispatchAdmin("admin_adjust_user", {
            targetUserId,
            deltaBalance,
          })
        }
      />
      <QueueController jobs={state.d1Database?.vietsubQueue} />
      <KvHotReloadManager
        configs={state.kvStore?.config}
        onSaveKv={(key, value) =>
          handleDispatchAdmin("admin_hot_reload", { key, value })
        }
      />
    </div>
  );
}
