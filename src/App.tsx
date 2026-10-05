/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { PlatformState, ActiveWorkspaceTab } from "./types/platform";
import { AdminPortalView } from "./components/AdminPortalView";
import { WasmStudioView } from "./components/WasmStudioView";
import { ClientMiniAppView } from "./components/ClientMiniAppView";
import { EdgeDevOpsDataView } from "./components/EdgeDevOpsDataView";
import { ArchitectureTopologyView } from "./components/ArchitectureTopologyView";
import { MonorepoSourceExplorer } from "./components/MonorepoSourceExplorer";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>("admin");
  const [platformState, setPlatformState] = useState<PlatformState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPlatformState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: PlatformState = await res.json();
      setPlatformState(data);
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Không thể tải trạng thái từ Edge Gateway."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformState();
  }, [fetchPlatformState]);

  const handleGatewayDispatch = async (
    route: string,
    payload: Record<string, unknown>,
    sourceClient = "Admin Web Portal L1 (Tier 1)",
    userId = "usr_901"
  ) => {
    try {
      const res = await fetch("/api/gateway/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceClient,
          route,
          userId,
          payload,
        }),
      });
      const data = await res.json();
      await fetchPlatformState();
      return {
        ok: Boolean(data.ok),
        error: data.error,
        resultData: data.resultData,
      };
    } catch {
      return {
        ok: false,
        error: "Lỗi kết nối tới Cloudflare Worker Central Dispatcher.",
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones (Single-element Brand | 5 Nav Links | 2 Primary Actions) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/90 bg-[#0B0F17]/95 sticky top-0 z-30 backdrop-blur">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("admin");
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          CyberSub Edge
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {[
            { id: "monorepo", label: "Mã Nguồn Monorepo" },
            { id: "admin", label: "Admin Portal L1" },
            { id: "studio", label: "Vietsub WASM Studio" },
            { id: "client", label: "Bot & Mini App" },
            { id: "devops", label: "Edge & DevOps" },
          ].map((navItem) => {
            const isActive = activeTab === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() =>
                  setActiveTab(navItem.id as ActiveWorkspaceTab)
                }
                className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-sky-400 text-white font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-100"
                }`}
              >
                {navItem.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("architecture")}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#111827] border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Sơ Đồ 7 Tầng
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap"
          >
            Dựng Vietsub AI
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (Visible only on small screens) */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-slate-800/90 bg-[#111827]">
        {[
          { id: "monorepo", label: "Mã Nguồn" },
          { id: "admin", label: "Admin L1" },
          { id: "studio", label: "WASM Studio" },
          { id: "client", label: "Bot & Mini App" },
          { id: "devops", label: "Edge & DevOps" },
          { id: "architecture", label: "Sơ Đồ 7 Tầng" },
        ].map((navItem) => (
          <button
            key={navItem.id}
            onClick={() => setActiveTab(navItem.id as ActiveWorkspaceTab)}
            className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
              activeTab === navItem.id
                ? "bg-sky-500 text-slate-950 font-semibold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {navItem.label}
          </button>
        ))}
      </div>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6">
        {/* Contextual Workspace Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="text-xs text-sky-400 font-medium">
              Hệ Thống Điều Phối Biên Cloudflare Workers · D1 · KV · R2 · SubtitlesOctopus WASM
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white mt-1"
              style={{ textWrap: "balance" }}
            >
              {activeTab === "monorepo" &&
                "Cây Mã Nguồn Monorepo (.github · apps · packages · workers · scripts · database)"}
              {activeTab === "admin" &&
                "Admin Web Portal L1 — Quản Trị Doanh Thu, RBAC & Hot-Reload KV"}
              {activeTab === "studio" &&
                "Vietsub WASM Studio — SubtitlesOctopus C++ Render & AI Translation"}
              {activeTab === "client" &&
                "Telegram Bot Chat & Mini App React 19 UI — Trung Tâm Dịch Vụ Core"}
              {activeTab === "devops" &&
                "DevOps Auto-Bindings, Edge Gateway Dispatcher & Lưu Trữ D1 / KV / R2"}
              {activeTab === "architecture" &&
                "Bản Đồ Kiến Trúc 7 Tầng (Tier 1 → Tier 7 Interactive Explorer)"}
            </h1>
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Edge Gateway: HMAC-SHA256 Enforced · D1 SQLite Synced
          </div>
        </div>

        {/* Loading / Error / Populated Views */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-[#111827] border border-slate-800/80 rounded-lg animate-pulse" />
            <div className="h-96 bg-[#111827] border border-slate-800/80 rounded-lg animate-pulse" />
          </div>
        ) : loadError || !platformState ? (
          <div className="p-8 bg-[#111827] border border-rose-800/60 rounded-lg text-center space-y-3">
            <div className="text-sm font-semibold text-rose-300">
              {loadError || "Không thể kết nối tới máy chủ điều phối."}
            </div>
            <button
              onClick={fetchPlatformState}
              className="px-4 py-2 text-xs font-semibold bg-sky-500 text-slate-950 rounded-md"
            >
              Thử Lại Kết Nối
            </button>
          </div>
        ) : (
          <>
            {activeTab === "monorepo" && <MonorepoSourceExplorer />}

            {activeTab === "admin" && (
              <AdminPortalView
                state={platformState}
                onDispatch={handleGatewayDispatch}
                onNavigateTab={setActiveTab}
                onRefresh={fetchPlatformState}
              />
            )}

            {activeTab === "studio" && (
              <WasmStudioView
                initialCues={platformState.studioSubtitles}
                onRefreshState={fetchPlatformState}
              />
            )}

            {activeTab === "client" && (
              <ClientMiniAppView
                state={platformState}
                onDispatch={handleGatewayDispatch}
              />
            )}

            {activeTab === "devops" && (
              <EdgeDevOpsDataView
                state={platformState}
                onRefreshState={fetchPlatformState}
              />
            )}

            {activeTab === "architecture" && (
              <ArchitectureTopologyView
                state={platformState}
                onNavigateTab={setActiveTab}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
