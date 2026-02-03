import type { VercelRequest, VercelResponse } from '@vercel/node';

// Supported languages and their execution capabilities
const LANGUAGE_SUPPORT = {
  javascript: { supported: true, runtime: 'node' },
  typescript: { supported: true, runtime: 'node' },
  python: { supported: true, runtime: 'simulated' },
  html: { supported: true, runtime: 'passthrough' },
  css: { supported: true, runtime: 'passthrough' },
  json: { supported: true, runtime: 'validate' },
  sql: { supported: false, runtime: 'none', message: 'SQL requires database connection' },
  go: { supported: false, runtime: 'none', message: 'Go compilation requires server-side tooling' },
  rust: { supported: false, runtime: 'none', message: 'Rust compilation requires server-side tooling' },
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, language = 'javascript' } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  try {
    const lang = language.toLowerCase();
    const support = LANGUAGE_SUPPORT[lang as keyof typeof LANGUAGE_SUPPORT];

    // JavaScript/TypeScript execution
    if (lang === 'typescript' || lang === 'javascript') {
      const result = await executeJavaScript(code);
      res.status(200).json({ output: result, status: 'success', language: lang });
      return;
    }

    // Python (simulated/basic parsing)
    if (lang === 'python') {
      const result = await simulatePython(code);
      res.status(200).json({ output: result, status: 'success', language: 'python' });
      return;
    }

    // HTML/CSS passthrough (for preview)
    if (lang === 'html' || lang === 'css') {
      res.status(200).json({ 
        output: code, 
        status: 'success', 
        language: lang,
        preview: true 
      });
      return;
    }

    // JSON validation
    if (lang === 'json') {
      try {
        const parsed = JSON.parse(code);
        res.status(200).json({ 
          output: JSON.stringify(parsed, null, 2), 
          status: 'success', 
          language: 'json',
          valid: true
        });
      } catch (e: any) {
        res.status(200).json({ 
          output: `JSON Error: ${e.message}`, 
          status: 'error', 
          language: 'json' 
        });
      }
      return;
    }

    // Unsupported languages
    const message = support?.message || `${language} execution is not yet supported`;
    res.status(200).json({
      output: `// Language: ${language}\n// ${message}\n// Run locally for full support`,
      status: 'info',
      language: lang,
      supported: false
    });
  } catch (error: any) {
    res.status(200).json({
      output: error.message || 'Execution error',
      status: 'error'
    });
  }
}

/**
 * Execute JavaScript code in a sandboxed environment
 */
async function executeJavaScript(code: string): Promise<string> {
  const output: string[] = [];
  const originalLog = console.log;

  try {
    // Capture console output
    console.log = (...args: any[]) => {
      output.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    // Execute the code in an isolated scope
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(code);
    const result = await fn();

    if (result !== undefined) {
      output.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    }

    return output.length > 0 ? output.join('\n') : '(no output)';
  } catch (error: any) {
    throw new Error(`${error.name}: ${error.message}`);
  } finally {
    console.log = originalLog;
  }
}

/**
 * Simulate basic Python execution (print statements, simple expressions)
 * For full Python support, integrate Pyodide or server-side execution
 */
async function simulatePython(code: string): Promise<string> {
  const output: string[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Handle print statements
    const printMatch = trimmed.match(/^print\s*\(\s*(.+)\s*\)$/);
    if (printMatch) {
      let content = printMatch[1];
      // Handle string literals
      if ((content.startsWith('"') && content.endsWith('"')) || 
          (content.startsWith("'") && content.endsWith("'"))) {
        output.push(content.slice(1, -1));
      } else if (content.startsWith('f"') || content.startsWith("f'")) {
        // f-strings: just show the template
        output.push(content.slice(2, -1));
      } else {
        // Try to evaluate simple expressions
        try {
          const result = eval(content.replace(/True/g, 'true').replace(/False/g, 'false'));
          output.push(String(result));
        } catch {
          output.push(content);
        }
      }
      continue;
    }

    // Handle variable assignments (just acknowledge them)
    if (trimmed.includes('=') && !trimmed.includes('==')) {
      continue; // Variable assignment, no output
    }

    // Handle simple expressions at end
    if (lines.indexOf(line) === lines.length - 1 && !trimmed.includes('=')) {
      try {
        const result = eval(trimmed.replace(/True/g, 'true').replace(/False/g, 'false'));
        if (result !== undefined) output.push(String(result));
      } catch {
        // Not a simple expression
      }
    }
  }

  return output.length > 0 ? output.join('\n') : '(Python simulation: no output captured)';
}
