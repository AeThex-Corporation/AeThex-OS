import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ExecutionResult {
  output: string;
  status: 'success' | 'error' | 'info';
  timestamp: number;
  code: string;
}

interface LabTerminalContextType {
  executionHistory: ExecutionResult[];
  isExecuting: boolean;
  executeCode: (code: string, language: string) => Promise<void>;
  clearHistory: () => void;
  lastExecution: ExecutionResult | null;
}

const LabTerminalContext = createContext<LabTerminalContextType | undefined>(undefined);

export function LabTerminalProvider({ children }: { children: ReactNode }) {
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCode = useCallback(async (code: string, language: string) => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      const result: ExecutionResult = {
        output: data.output,
        status: data.status,
        timestamp: Date.now(),
        code,
      };

      setExecutionHistory(prev => [result, ...prev]);
    } catch (error: any) {
      const result: ExecutionResult = {
        output: error.message,
        status: 'error',
        timestamp: Date.now(),
        code,
      };
      setExecutionHistory(prev => [result, ...prev]);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  const lastExecution = executionHistory[0] || null;

  return (
    <LabTerminalContext.Provider
      value={{
        executionHistory,
        isExecuting,
        executeCode,
        clearHistory,
        lastExecution,
      }}
    >
      {children}
    </LabTerminalContext.Provider>
  );
}

export function useLabTerminal() {
  const context = useContext(LabTerminalContext);
  if (!context) {
    throw new Error('useLabTerminal must be used within LabTerminalProvider');
  }
  return context;
}
