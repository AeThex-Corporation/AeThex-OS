import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Folder, Plus, Trash2, Download, Copy, Loader2, HardDrive } from "lucide-react";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { nanoid } from "nanoid";

interface FileItem {
  id: string;
  user_id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  size?: number;
  modified: string;
  language?: string;
  is_folder?: boolean;
  created_at?: Date;
}

export default function FileManager() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState("/root");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchFiles();
  }, [user, currentPath]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('path', currentPath)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setFiles(data.map(f => ({
          ...f,
          type: f.is_folder ? 'folder' : 'file',
          modified: new Date(f.created_at).toLocaleDateString()
        })));
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const deleteFile = async (id: string) => {
    try {
      await supabase.from('files').delete().eq('id', id);
      setFiles(files.filter((f) => f.id !== id));
      if (selectedFile?.id === id) setSelectedFile(null);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const embedded = isEmbedded();
  const { useMobileStyles, theme } = getResponsiveStyles();

  // Mobile-optimized layout when embedded or on mobile device
  if (useMobileStyles) {
    return (
      <div className="min-h-screen" style={{ background: theme.gradientBg }}>
        <div className="p-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderClass} flex items-center justify-center`}>
                <HardDrive className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>File Manager</h1>
                <p className="text-zinc-500 text-xs">{files.length} files</p>
              </div>
            </div>
            <Button className={`${theme.activeBtn} ${theme.hoverBtn} gap-1`} size="sm">
              <Plus className="w-4 h-4" /> New
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl px-4 py-2 mb-4 text-xs text-zinc-400`}>
            <span className={theme.primaryClass}>root</span>
            {currentPath.split("/").filter(Boolean).map((part, idx) => (
              <span key={idx}> / <span className="text-zinc-400">{part}</span></span>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* File List */}
          {!loading && (
            <div className="space-y-2">
              {files.length === 0 ? (
                <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                  <Folder className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                  <p className="text-zinc-500 text-sm">No files yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Upload or create a new file</p>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 active:scale-[0.98] transition-all ${
                      selectedFile?.id === file.id ? `border-2 ${theme.isFoundation ? 'border-red-500' : 'border-blue-500'}` : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {file.type === "folder" ? (
                        <Folder className={`w-8 h-8 ${theme.isFoundation ? 'text-red-400' : 'text-blue-400'}`} />
                      ) : (
                        <FileText className="w-8 h-8 text-zinc-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{file.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {file.type === "file" && file.language && `${file.language.toUpperCase()} • `}
                          {formatFileSize(file.size)} • {file.modified}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="text-red-400 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected File Actions */}
          {selectedFile && selectedFile.type === "file" && (
            <div className={`fixed bottom-20 left-4 right-4 ${theme.cardBg} border ${theme.borderClass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-[10px] text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-zinc-400">✕</button>
              </div>
              <div className="flex gap-2">
                <Button className={`flex-1 ${theme.activeBtn} ${theme.hoverBtn} gap-1 text-xs`} size="sm">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 gap-1 text-xs" size="sm">
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header - hidden when embedded in OS iframe */}
      {!embedded && (
        <div className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-white">File Manager</h1>
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            <Plus className="w-4 h-4" />
            New File
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* File List */}
        <div className="flex-1 border-r border-slate-700 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="border-b border-slate-700 px-6 py-3 flex items-center gap-2 text-sm text-slate-400 bg-slate-800">
            <button className="hover:text-cyan-400">root</button>
            {currentPath.split("/").map(
              (part, idx) =>
                part && (
                  <div key={idx}>
                    <span>/</span>
                    <button className="hover:text-cyan-400 ml-1">{part}</button>
                  </div>
                )
            )}
          </div>

          {/* File Table */}
          <div className="p-4 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedFile?.id === file.id
                    ? "bg-slate-700 border-cyan-500"
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {file.type === "folder" ? (
                    <Folder className="w-5 h-5 text-blue-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {file.type === "file" && file.language && (
                        <>
                          {file.language.toUpperCase()} •{" "}
                        </>
                      )}
                      {formatFileSize(file.size)} • {file.modified}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}
                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Preview */}
        {selectedFile && selectedFile.type === "file" && (
          <div className="w-96 border-l border-slate-700 flex flex-col bg-slate-800">
            {/* File Info */}
            <div className="border-b border-slate-700 p-4">
              <h2 className="text-lg font-bold text-white mb-2">{selectedFile.name}</h2>
              <div className="space-y-1 text-sm text-slate-400">
                <p>Size: {formatFileSize(selectedFile.size)}</p>
                <p>Modified: {selectedFile.modified}</p>
                {selectedFile.language && (
                  <p>Language: {selectedFile.language.toUpperCase()}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-b border-slate-700 p-4 flex gap-2">
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button variant="outline" className="flex-1 border-slate-600 gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300">
              <div className="text-gray-500">
                <div>{"import { Create, Delete, Upload } from 'fs';"}</div>
                <div className="mt-2">// Sample file content preview</div>
                <div className="mt-2">{"export function createFile(path: string) {"}</div>
                <div className="ml-4">// Implementation here</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
