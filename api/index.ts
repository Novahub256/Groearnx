import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../server.js';

const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Serverless API handler error.',
      })
    );
    return undefined;
  }
}
