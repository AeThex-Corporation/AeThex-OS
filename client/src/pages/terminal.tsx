import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useLabTerminal } from "@/hooks/use-lab-terminal";
import { ArrowLeft, Terminal as TerminalIcon, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: 'system',
      content: '▸ AeThex Terminal v4.2 - Type "help" for commands',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { executionHistory, executeCode, isExecuting } = useLabTerminal();

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  // Show last execution in terminal
  useEffect(() => {
    if (executionHistory.length > 0) {
      const latest = executionHistory[0];
      setLines((prev) => [
        ...prev,
        {
          type: 'input',
          content: `> run "${latest.code.split('\n')[0]}..."`,
          timestamp: latest.timestamp,
        },
        {
          type: latest.status === 'error' ? 'error' : 'output',
          content: latest.output,
          timestamp: latest.timestamp,
        },
      ]);
    }
  }, [executionHistory]);

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setLines((prev) => [
      ...prev,
      { type: 'input', content: `> ${trimmed}`, timestamp: Date.now() },
    ]);

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'help':
        setLines((prev) => [
          ...prev,
          {
            type: 'system',
            content: `Available commands:
  help              - Show this help message
  clear             - Clear terminal
  execute <code>    - Execute JavaScript code
  run <file>        - Run code from Lab
  history           - Show command history
  exit              - Exit terminal`,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'clear':
        setLines([]);
        break;

      case 'history':
        setLines((prev) => [
          ...prev,
          {
            type: 'output',
            content: commandHistory.join('\n') || '(empty)',
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'execute':
        const code = parts.slice(1).join(' ');
        if (code) {
          executeCode(code, 'javascript');
        } else {
          setLines((prev) => [
            ...prev,
            {
              type: 'error',
              content: 'Usage: execute <code>',
              timestamp: Date.now(),
            },
          ]);
        }
        break;

      case 'run':
        setLines((prev) => [
          ...prev,
          {
            type: 'output',
            content: '▸ Open Lab to run files',
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'exit':
        setLines((prev) => [
          ...prev,
          {
            type: 'system',
            content: '▸ Type "help" to see available commands',
            timestamp: Date.now(),
          },
        ]);
        break;

      default:
        setLines((prev) => [
          ...prev,
          {
            type: 'error',
            content: `Command not found: ${command}. Type "help" for available commands.`,
            timestamp: Date.now(),
          },
        ]);
    }

    setCommandHistory((prev) => [...prev, trimmed]);
    setInput("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0c] text-[#a9b7c6] flex flex-col font-mono">
      {/* Header */}
      <div className="h-12 border-b border-[#2b2d30] bg-[#1e1f22] flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="text-[#a9b7c6] hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">AeThex Terminal v4.2</span>
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded ml-2">
              [ ONLINE ]
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(lines.map((l) => l.content).join('\n'))}
            className="text-[#a9b7c6] hover:bg-[#2b2d30]"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLines([])}
            className="text-[#a9b7c6] hover:bg-[#2b2d30]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#0a0a0c]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs leading-relaxed ${
              line.type === 'error'
                ? 'text-red-500'
                : line.type === 'input'
                  ? 'text-cyan-400'
                  : line.type === 'system'
                    ? 'text-yellow-600'
                    : 'text-[#a9b7c6]'
            }`}
          >
            {line.content.split('\n').map((part, idx) => (
              <div key={idx}>{part}</div>
            ))}
          </motion.div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-[#2b2d30] bg-[#1e1f22] p-3">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">▸</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command... (help for list)"
            className="flex-1 bg-[#0a0a0c] border-0 text-[#a9b7c6] placeholder-[#555] focus:ring-0 focus:outline-none font-mono text-xs"
            disabled={isExecuting}
            autoFocus
          />
          {isExecuting && (
            <span className="text-yellow-500 text-xs animate-pulse">executing...</span>
          )}
        </div>
      </div>
    </div>
  );
}
