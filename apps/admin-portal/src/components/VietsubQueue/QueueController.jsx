import React from "react";

export function QueueController({ jobs = [] }) {
  return (
    <section className="p-5 bg-[#111827] border border-slate-800 rounded-lg">
      <h2 className="text-base font-semibold text-white">
        03. Vietsub AI Queue Control (Whisper STT & GPT-4o)
      </h2>
      <div className="mt-4 divide-y divide-slate-800 text-xs">
        {jobs.map((job) => (
          <div key={job.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-100">{job.title}</div>
              <div className="text-slate-400 font-mono">
                {job.sourceLang} → {job.targetLang} · {job.renderMode}
              </div>
            </div>
            <span className="font-mono text-emerald-400">
              {job.progress}% · {job.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
