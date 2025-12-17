import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { addLog } from '../services/apiLogsService';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

// Middleware di logging per tutte le chiamate tRPC
const loggingMiddleware = t.middleware(async (opts) => {
  const { path, type, next } = opts;
  const start = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log solo se non è una chiamata a guardian (per evitare loop infiniti)
    if (!path.startsWith('guardian.')) {
      addLog({
        level: 'info',
        app: 'TRPC',
        type: 'API_CALL',
        endpoint: `/api/trpc/${path}`,
        method: type.toUpperCase(),
        statusCode: 200,
        responseTime: duration,
        message: `${type.toUpperCase()} ${path}`,
        userEmail: opts.ctx.user?.email || 'anonymous',
      });
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    
    // Log errori solo se non è una chiamata a guardian
    if (!path.startsWith('guardian.')) {
      addLog({
        level: 'error',
        app: 'TRPC',
        type: 'ERROR',
        endpoint: `/api/trpc/${path}`,
        method: type.toUpperCase(),
        statusCode: error.code === 'UNAUTHORIZED' ? 401 : 500,
        responseTime: duration,
        message: `Error in ${type.toUpperCase()} ${path}: ${error.message}`,
        userEmail: opts.ctx.user?.email || 'anonymous',
        details: {
          code: error.code,
          message: error.message,
        },
      });
    }
    
    throw error;
  }
});

export const publicProcedure = t.procedure.use(loggingMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(loggingMiddleware).use(requireUser);

const requireAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(loggingMiddleware).use(requireAdmin);
