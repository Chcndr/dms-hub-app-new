import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { addLog } from '../services/apiLogsService';
import { getDb } from '../db';
import * as schema from '../../drizzle/schema';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

/**
 * Salva la metrica API nel database per statistiche persistenti
 */
async function saveApiMetric(data: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    
    await db.insert(schema.apiMetrics).values({
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      errorMessage: data.errorMessage || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  } catch (error) {
    // Non bloccare la richiesta se il logging fallisce
    console.error('[API Metrics] Errore salvataggio metrica:', error);
  }
}

// Middleware di logging per tutte le chiamate tRPC
const loggingMiddleware = t.middleware(async (opts) => {
  const { path, type, next } = opts;
  const start = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log solo se non è una chiamata a guardian o integrations.apiStats (per evitare loop infiniti)
    if (!path.startsWith('guardian.') && !path.startsWith('integrations.apiStats')) {
      // Log in memoria (per Guardian real-time)
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
      
      // Salva nel database (per statistiche persistenti)
      saveApiMetric({
        endpoint: `/api/trpc/${path}`,
        method: type.toUpperCase(),
        statusCode: 200,
        responseTime: duration,
      });
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 
                       error.code === 'FORBIDDEN' ? 403 :
                       error.code === 'NOT_FOUND' ? 404 : 500;
    
    // Log errori solo se non è una chiamata a guardian
    if (!path.startsWith('guardian.') && !path.startsWith('integrations.apiStats')) {
      // Log in memoria (per Guardian real-time)
      addLog({
        level: 'error',
        app: 'TRPC',
        type: 'ERROR',
        endpoint: `/api/trpc/${path}`,
        method: type.toUpperCase(),
        statusCode,
        responseTime: duration,
        message: `Error in ${type.toUpperCase()} ${path}: ${error.message}`,
        userEmail: opts.ctx.user?.email || 'anonymous',
        details: {
          code: error.code,
          message: error.message,
        },
      });
      
      // Salva nel database (per statistiche persistenti)
      saveApiMetric({
        endpoint: `/api/trpc/${path}`,
        method: type.toUpperCase(),
        statusCode,
        responseTime: duration,
        errorMessage: error.message,
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
