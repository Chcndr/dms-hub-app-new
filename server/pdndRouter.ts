/**
 * PDND Router — Piattaforma Digitale Nazionale Dati + ANPR
 *
 * Procedure tRPC per:
 * - Stato connessione PDND
 * - Lista e pubblicazione e-Service
 * - Test connettivita'
 * - Verifica Codice Fiscale su ANPR (via PDND)
 * - Verifica Residenza su ANPR (via PDND)
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";

// Regex per codice fiscale italiano (16 caratteri alfanumerici)
const codiceFiscaleSchema = z
  .string()
  .regex(
    /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i,
    "Codice fiscale non valido. Formato: 16 caratteri alfanumerici (es. RSSMRA85M01H501Z)"
  )
  .transform((v) => v.toUpperCase());

export const pdndRouter = router({
  /**
   * Stato connessione PDND (mock o live).
   */
  getStatus: adminProcedure.query(async () => {
    const { testConnection } = await import("./services/pdndService");
    return await testConnection();
  }),

  /**
   * Lista e-Service disponibili e loro stato di pubblicazione.
   */
  listEServices: adminProcedure.query(async () => {
    const { listEServices } = await import("./services/pdndService");
    return listEServices();
  }),

  /**
   * Pubblica un e-Service su PDND.
   */
  publishEService: adminProcedure
    .input(
      z.object({
        serviceId: z.enum(["dms-mercati", "dms-concessioni", "dms-operatori"]),
        metadata: z.object({
          name: z.string().min(1).max(200),
          description: z.string().min(1).max(1000),
          technology: z.enum(["REST", "SOAP"]).default("REST"),
          version: z.string().default("1.0.0"),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { publishEService } = await import("./services/pdndService");
      return await publishEService(input.serviceId, input.metadata);
    }),

  /**
   * Test connettivita' PDND.
   */
  testConnection: adminProcedure.mutation(async () => {
    const { testConnection } = await import("./services/pdndService");
    return await testConnection();
  }),

  // ============================================
  // ANPR via PDND (Punto 3.2)
  // ============================================

  /**
   * Verifica esistenza Codice Fiscale su ANPR.
   */
  verificaCF: protectedProcedure
    .input(z.object({ codiceFiscale: codiceFiscaleSchema }))
    .query(async ({ input }) => {
      const { verificaCodiceFiscale } = await import("./services/pdndService");
      return await verificaCodiceFiscale(input.codiceFiscale);
    }),

  /**
   * Verifica residenza da Codice Fiscale su ANPR.
   */
  verificaResidenza: adminProcedure
    .input(z.object({ codiceFiscale: codiceFiscaleSchema }))
    .query(async ({ input }) => {
      const { verificaResidenza } = await import("./services/pdndService");
      return await verificaResidenza(input.codiceFiscale);
    }),
});
