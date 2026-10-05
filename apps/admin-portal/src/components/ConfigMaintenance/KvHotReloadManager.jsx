import React, { useState } from "react";

export function KvHotReloadManager({ configs = [], onSaveKv }) {
  const [key, setKey] = useState("WASM_OCTOPUS_MEMORY_LIMIT_MB");
  const [value, setValue] = useState("1024");

  return (
    <section className="p-5 bg-[#111827] border border-slate-800 rounded-lg space-y-4">
      <h2 className="text-base font-semibold text-white">
        04. Hot-Reload Config & Key Manager (Cloudflare KV)
      </h2>
      <div className="flex gap-2 text-xs">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="px-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded font-mono text-slate-100"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded font-mono text-slate-100"
        />
        <button
          onClick={() => onSaveKv?.(key, value)}
          className="px-4 py-1.5 bg-sky-500 text-slate-950 font-semibold rounded"
        >
          Hot-Reload KV
        </button>
      </div>
      <div className="divide-y divide-slate-800 text-xs font-mono">
        {configs.map((c) => (
          <div key={c.key} className="py-2 flex justify-between">
            <span className="text-sky-400">{c.key}</span>
            <span className="text-emerald-400">{c.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
