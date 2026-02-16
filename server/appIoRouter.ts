/**
 * AppIO Router — Notifiche tramite App IO
 *
 * Procedure tRPC per:
 * - Invio notifiche con template predefiniti
 * - Verifica profilo cittadino su App IO
 * - Stato connessione App IO
 * - Lista template disponibili
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";

// Regex per codice fiscale italiano
const codiceFiscaleSchema = z
  .string()
  .regex(
    /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i,
    "Codice fiscale non valido"
  )
  .transform((v) => v.toUpperCase());

export const appIoRouter = router({
  /**
   * Invia una notifica tramite App IO usando un template predefinito.
   */
  sendNotification: adminProcedure
    .input(
      z.object({
        fiscalCode: codiceFiscaleSchema,
        templateId: z.enum([
          "scadenza_concessione",
          "avviso_pagamento",
          "verbale_emesso",
          "conferma_prenotazione",
        ]),
        params: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const { sendTemplateMessage } = await import("./services/appIoService");
      return await sendTemplateMessage(
        input.fiscalCode,
        input.templateId,
        input.params
      );
    }),

  /**
   * Verifica se un cittadino ha App IO attiva.
   */
  checkProfile: protectedProcedure
    .input(z.object({ fiscalCode: codiceFiscaleSchema }))
    .query(async ({ input }) => {
      const { getProfile } = await import("./services/appIoService");
      return await getProfile(input.fiscalCode);
    }),

  /**
   * Stato connessione App IO (mock o live).
   */
  getStatus: adminProcedure.query(async () => {
    const { getStatus } = await import("./services/appIoService");
    return await getStatus();
  }),

  /**
   * Lista template messaggi disponibili.
   */
  listTemplates: protectedProcedure.query(async () => {
    const { listTemplates } = await import("./services/appIoService");
    return listTemplates();
  }),
});
