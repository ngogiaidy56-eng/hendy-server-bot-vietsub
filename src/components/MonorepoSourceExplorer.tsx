import React, { useState, useEffect } from "react";
import { MonorepoFileItem } from "../types/platform";
import {
  FolderGit2,
  FileCode2,
  Copy,
  Download,
  Search,
  CheckCircle2,
} from "lucide-react";

export const MonorepoSourceExplorer: React.FC = () => {
  const [files, setFiles] = useState<MonorepoFileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<MonorepoFileItem | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMonorepoFiles() {
      try {
        const res = await fetch("/api/monorepo/files");
        const data = await res.json();
        if (data.ok && Array.isArray(data.files)) {
          setFiles(data.files);
          if (data.files.length > 0) {
            setSelectedFile(data.files[0]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadMonorepoFiles();
  }, []);

  const filteredFiles = files.filter((f) => {
    const matchCategory =
      categoryFilter === "all" || f.category === categoryFilter;
    const matchSearch =
      !searchQuery.trim() ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCopyContent = (file: MonorepoFileItem) => {
    navigator.clipboard.writeText(file.content);
    setCopiedPath(file.path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDownloadSingleFile = (file: MonorepoFileItem) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.path.split("/").pop() || "file.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadShellInstaller = () => {
    const scriptLines: string[] = [
      "#!/usr/bin/env bash",
      "# Self-extracting generator for 7-Tier Vietsub & Cloudflare Edge Monorepo",
      "set -euo pipefail",
      "",
    ];

    for (const f of files) {
      const lastSlash = f.path.lastIndexOf("/");
      if (lastSlash > 0) {
        const dir = f.path.substring(0, lastSlash);
        scriptLines.push(`mkdir -p "${dir}"`);
      }
      scriptLines.push(`cat << 'EOF_MONOREPO_FILE' > "${f.path}"`);
      scriptLines.push(f.content);
      scriptLines.push("EOF_MONOREPO_FILE");
      scriptLines.push("");
    }

    scriptLines.push(
      'echo "Successfully extracted all monorepo files!"'
    );

    const blob = new Blob([scriptLines.join("\n")], {
      type: "text/x-shellscript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "setup-vietsub-monorepo.sh";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-[#111827] border border-slate-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Toàn Bộ {files.length} Tệp Mã Nguồn Monorepo (.github · apps · packages · workers · scripts · database)
            </h2>
            <p className="text-xs text-slate-400">
              Chọn bất kỳ tệp nào trong cây thư mục để xem chi tiết, sao chép hoặc tải script tự động dựng toàn bộ Monorepo.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadShellInstaller}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Tải Toàn Bộ Monorepo (.sh Generator)
        </button>
      </div>

      {/* Category Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-800">
          {[
            { id: "all", label: `Tất cả (${files.length})` },
            { id: ".github", label: ".github/workflows" },
            { id: ".wrangler", label: ".wrangler" },
            { id: "apps", label: "apps/ (Portal, Studio, MiniApp)" },
            { id: "packages", label: "packages/ (Types, Vault, SDK)" },
            { id: "workers", label: "workers/ (Dispatcher & FastAPI)" },
            { id: "scripts", label: "scripts/ (DevOps)" },
            { id: "database", label: "database/ (D1 SQL)" },
            { id: "root", label: "Root Configs" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-sky-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên tệp hoặc nội dung code..."
            className="pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Split View: File Tree List (Left 4 Cols) | Code Viewer (Right 8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800/90 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/80 text-xs font-semibold text-slate-200 bg-[#0B0F17]/50">
            Cây Thư Mục ({filteredFiles.length} tệp)
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-sky-950/45 text-sky-300 font-medium"
                      : "text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-mono truncate">{file.path}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                    {file.sizeBytes}B
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#111827] border border-slate-800/90 rounded-lg overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="px-5 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-[#0B0F17]/50">
                <div>
                  <div className="text-xs font-mono font-semibold text-sky-400">
                    {selectedFile.path}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Phân hệ: {selectedFile.category} · Dung lượng: {selectedFile.sizeBytes} bytes
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyContent(selectedFile)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded transition-colors whitespace-nowrap"
                  >
                    {copiedPath === selectedFile.path ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Sao chép mã
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadSingleFile(selectedFile)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải tệp lẻ
                  </button>
                </div>
              </div>

              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed bg-[#070A10]">
                {selectedFile.content}
              </pre>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
