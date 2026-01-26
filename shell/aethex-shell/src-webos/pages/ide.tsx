import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

const sampleFiles = [
  {
    name: "main.tsx",
    path: "src/main.tsx",
    language: "typescript",
    content: `import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
  },
  {
    name: "server.ts",
    path: "server/index.ts",
    language: "typescript",
    content: `import express from "express"

const app = express()
app.get("/health", (_req, res) => res.json({ ok: true }))
app.listen(3000, () => console.log("Server listening on :3000"))
`,
  },
  {
    name: "styles.css",
    path: "src/styles.css",
    language: "css",
    content: `:root { --accent: #00d9ff; }
body { margin: 0; font-family: system-ui, sans-serif; }
`,
  },
];

export default function IdePage() {
  const [activePath, setActivePath] = useState(sampleFiles[0].path);
  const [contents, setContents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    sampleFiles.forEach((file) => {
      initial[file.path] = file.content;
    });
    return initial;
  });

  const activeFile = useMemo(() => sampleFiles.find((f) => f.path === activePath)!, [activePath]);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <aside className="w-64 border-r border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-cyan-300">Workspace</div>
        <nav className="px-2 pb-4 space-y-1">
          {sampleFiles.map((file) => {
            const isActive = file.path === activePath;
            return (
              <button
                key={file.path}
                onClick={() => setActivePath(file.path)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition",
                  isActive ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/40" : "hover:bg-white/5 text-slate-200"
                )}
              >
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-[11px] text-slate-400">{file.path}</div>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-2 backdrop-blur">
          <div>
            <div className="text-sm font-semibold text-cyan-200">AeThex IDE (Monaco)</div>
            <div className="text-xs text-slate-400">Active file: {activeFile.path}</div>
          </div>
          <div className="flex gap-2 text-xs text-slate-400">
            <span className="rounded border border-white/10 px-2 py-1">Ctrl/Cmd + S to save (stub)</span>
            <span className="rounded border border-white/10 px-2 py-1">Monaco powered</span>
          </div>
        </header>

        <section className="flex-1 min-h-0">
          <Editor
            path={activeFile.path}
            language={activeFile.language}
            theme="vs-dark"
            value={contents[activeFile.path]}
            onChange={(val) => {
              setContents((prev) => ({ ...prev, [activeFile.path]: val ?? "" }));
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              smoothScrolling: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
            loading={<div className="p-6 text-slate-300">Loading Monaco editor...</div>}
          />
        </section>
      </main>
    </div>
  );
}
