import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLabTerminal } from "@/hooks/use-lab-terminal";
import { ChevronDown, Plus, X, Copy, Download, Settings, Play, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

export default function Lab() {
  const [files, setFiles] = useState<File[]>([
    {
      id: "1",
      name: "registry.ts",
      language: "typescript",
      content: `interface Architect {
  id: string;
  level: number;
  xp: number;
  verified: boolean;
}

class MetaverseRegistry {
  private architects: Map<string, Architect>;

  constructor() {
    this.architects = new Map();
  }

  registerArchitect(architect: Architect): void {
    this.architects.set(architect.id, architect);
  }

  getArchitect(id: string): Architect | undefined {
    return this.architects.get(id);
  }

  getAllArchitects(): Architect[] {
    return Array.from(this.architects.values());
  }
}
`,
    },
    {
      id: "2",
      name: "README.txt",
      language: "text",
      content: `The Lab - Code Editor & Registry

Welcome to AeThex-OS Lab. This is where you can:
- Write and edit code
- Manage TypeScript interfaces and classes
- Build the MetaverseRegistry
- Compile and test your creations

Get started by creating new files or editing existing ones.
`,
    },
  ]);

  const [activeFileId, setActiveFileId] = useState(files[0].id);
  const [newFileName, setNewFileName] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { executeCode, isExecuting, lastExecution } = useLabTerminal();
  const [, setLocation] = useLocation();

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const newFile: File = {
      id: Date.now().toString(),
      name: newFileName,
      content: "",
      language: newFileName.endsWith(".ts") ? "typescript" : "text",
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName("");
  };

  const handleDeleteFile = (id: string) => {
    if (files.length === 1) return;
    const filtered = files.filter((f) => f.id !== id);
    setFiles(filtered);
    setActiveFileId(filtered[0].id);
  };

  const handleUpdateContent = (content: string) => {
    setFiles(
      files.map((f) =>
        f.id === activeFileId ? { ...f, content } : f
      )
    );
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(activeFile.content)}`
    );
    element.setAttribute("download", activeFile.name);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
  };

  const handleRun = async () => {
    if (!activeFile) return;
    await executeCode(activeFile.content, activeFile.language);
    // Open terminal to show results
    setLocation('/terminal');
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-cyan-400 text-2xl">&lt;/&gt;</div>
          <h1 className="text-xl font-bold text-white">The Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">FILES</h2>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="New file..."
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                }}
                className="h-8 text-xs bg-slate-800 border-slate-700"
              />
              <Button
                size="sm"
                onClick={handleCreateFile}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`px-4 py-2 flex items-center justify-between cursor-pointer border-l-2 transition-colors ${
                  activeFileId === file.id
                    ? "bg-slate-800 border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span className="text-sm truncate">{file.name}</span>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {activeFile && (
          <div className="flex-1 flex flex-col bg-slate-800">
            {/* Tab Bar */}
            <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  {activeFile.name}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {activeFile.language.toUpperCase()} • UTF-8 • Spaces: 2
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex overflow-hidden">
              {/* Line Numbers */}
              <div className="bg-slate-900 border-r border-slate-700 px-3 py-4 text-right select-none">
                {activeFile.content.split("\n").map((_, i) => (
                  <div
                    key={i}
                    className="text-slate-600 text-xs font-mono leading-6"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Editor Content */}
              <textarea
                ref={editorRef}
                value={activeFile.content}
                onChange={(e) => handleUpdateContent(e.target.value)}
                className="flex-1 bg-slate-800 text-slate-100 p-4 font-mono text-sm leading-6 resize-none focus:outline-none border-none focus:ring-0"
                spellCheck="false"
              />
            </div>

            {/* Status Bar */}
            <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-xs text-white">
              <div>
                Ln {activeFile.content.split("\n").length}, Col 1
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRun}
                  disabled={isExecuting}
                  className="text-white hover:bg-blue-700"
                >
                  {isExecuting ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  {isExecuting ? "Running..." : "Run"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="text-white hover:bg-blue-700"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="text-white hover:bg-blue-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
