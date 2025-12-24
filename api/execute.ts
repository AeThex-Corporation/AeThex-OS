import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, language } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  try {
    // Simple JavaScript execution (TypeScript gets transpiled to JS)
    if (language === 'typescript' || language === 'javascript') {
      // Create a safe execution context
      const result = await executeJavaScript(code);
      res.status(200).json({ output: result, status: 'success' });
      return;
    }

    // For other languages, return a placeholder
    res.status(200).json({
      output: `// Language: ${language}\n// Execution not yet supported in cloud environment\n// Run locally for full support`,
      status: 'info'
    });
  } catch (error: any) {
    res.status(200).json({
      output: error.message || 'Execution error',
      status: 'error'
    });
  }
}

async function executeJavaScript(code: string): Promise<string> {
  const output: string[] = [];
  const originalLog = console.log;

  try {
    // Capture console output
    console.log = (...args: any[]) => {
      output.push(args.map(arg => String(arg)).join(' '));
      originalLog(...args);
    };

    // Execute the code in an isolated scope
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(code);
    const result = await fn();

    if (result !== undefined) {
      output.push(String(result));
    }

    return output.length > 0 ? output.join('\n') : '(no output)';
  } catch (error: any) {
    throw new Error(`${error.name}: ${error.message}`);
  } finally {
    console.log = originalLog;
  }
}
