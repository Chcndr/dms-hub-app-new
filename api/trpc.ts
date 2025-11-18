import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from '../server/routers';

// Create tRPC HTTP handler
const handler = createHTTPHandler({
  router: appRouter,
  createContext: () => ({}),
});

// Vercel Serverless Function handler
export default async function (req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Node.js IncomingMessage format
  const nodeReq = Object.assign(req, {
    url: req.url || '/',
    method: req.method || 'GET',
  });

  // Convert Vercel response to Node.js ServerResponse format
  const nodeRes = Object.assign(res, {
    setHeader: (name: string, value: string | string[]) => {
      res.setHeader(name, value);
      return nodeRes;
    },
    end: (chunk?: any) => {
      res.end(chunk);
      return nodeRes;
    },
  });

  // Handle tRPC request
  return handler(nodeReq as any, nodeRes as any);
}
