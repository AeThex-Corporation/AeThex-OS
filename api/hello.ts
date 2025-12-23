// Basic Vercel serverless function example for AeThex-OS
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Hello from AeThex-OS API!' });
}
