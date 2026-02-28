# Analisi PDF - Note Chiave

## 1. Ambienti-chiamate-empoint.pdf (25 pagine)

### Fonti Dati e Integrazioni

**1) Identità - SPID/CIE (OIDC)**

- fiscalNumber → user.fiscal_code
- given_name → user.name
- family_name → user.family_name
- email → user.email
- birthdate → user.birthdate
- spidLevel/acr → user.loa (L2/L3)
- idp (issuer) → user.idp

**2) AE - Verifica P.IVA/CF (PDND)**

- vatNumber → impresa.vat_number
- taxCode → impresa.tax_code
- denomination → impresa.denomination
- status → impresa.vat_status (ATTIVA/SOSPESA/CESSATA)
- startDate → impresa.vat_start_date
- endDate → impresa.vat_end_date
- legalNature → impresa.legal_nature

**3) Registro Imprese (InfoCamere)**

- taxId/cf → impresa.tax_code
- vatNumber → impresa.vat_number
- rea.number → impresa.rea ("CCIAA-NUM")
- name → impresa.denomination
- ateco → impresa.ateco[] (lista codici)
- registeredOffice → impresa.registered_office{via/cap/city/prov}
- pec → impresa.pec (se manca → INAD/INI-PEC)

**3.2 Cariche/Soci**

- roles[].person_cf → impresa.roles[].person_cf
- roles[].role → impresa.roles[].role (TITOLARE/LEGALE/RAPP...)
- roles[].from/to → impresa.roles[].from_to

**4) INAD/INI-PEC (PEC ufficiale)**

- pec → impresa.pec (PEC valida RFC5321)

**5) DURC OnLine (via PDND)**

- status → durc.status (REGOLARE/IRREGOLARE/ND)
- validTo → durc.valid_to
- issuer → durc.source (INPS/INAIL/SPORTELLO)
- protocol → durc.protocol (per audit)

**6) SSU - Catalogo (Metadati)**

- lifeEvents[] → ssu.meta.life_events[]
- procedures[].id → ssu.meta.procedures[].id
- procedures[].name → ssu.meta.procedures[].name
- procedures[].regime → ssu.meta.procedures[].regime (SCIA/AU/COMUNICAZIONE)
- forms[].id → ssu.meta.forms[].id
- forms[].schema → ssu.meta.forms[].schema (XSD/JSON Schema)
- attachments[].required → ssu.meta.attachments[].required
- thirdParties[] → ssu.meta.third_parties[] (enti terzi competenti)

**7) SSU - BO SUAP (storico pratiche per impresa)**

- cui → pratica.cui (ID univoco istanza)
- kind → pratica.kind (SCIA_CAP/AU/...)
- subject.vat/cf → pratica.subject\_\* (impresa collegata)
- submittedAt → pratica.submitted_at
- state → pratica.state (ACQUISITA/IN_ISTR./CONCLUSA)
- boSuap → pratica.bo_suap (ufficio procedente)
- hasFinalAct → pratica.has_final_act (flag utile per concessione)

**8) MercaWeb - Concessioni/Presenze**

8.1 Concessioni:
| Campo | Tipo | DMS.dest | Note |
|-------|------|----------|------|
| concessionId | string | conc.id | |
| marketId | string | conc.market_id | |
| marketName | string | conc.market.name | |
| posteggio | string | conc.market.posteggio | A-12 ecc. |
| holder.vat/cf | string | conc.holder.\* | |
| issuedBy | string | conc.issued_by | Comune/ufficio |
| issuedAt | date | conc.issued_at | |
| validFrom/To | date | conc.valid_from/to | |
| status | enum | conc.status | ATTIVA/SOSPESA/REVOCATA |
| attachments[] | array | conc.attachments[] | atti |
| history[] | array | conc.history[] | rinnovi/subentri |

8.2 Presenze mercato:
| Campo | Tipo | DMS.dest | Note |
|-------|------|----------|------|
| presenceId | string | presenza.id | |
| date | date | presenza.date | |
| marketId/posteggio | string | presenza.marketId/posteggio | |
| operator.vat/cf | string | presenza.operator\_\* | |
| checkIn/Out | date | presenza.check_in/out | |
| delegate.cf | string | presenza.delegate_cf | dipendente delegato |
| notes | string | presenza.notes | |

**9) Maggioli Tributi - Canone Mercatale**

9.1 Posizione contribuente:

- positionId → trib.position_id
- vat/cf → trib.subject\_\*
- objects[] → trib.objects[] (oggetti imponibili/posteggi)
- status → trib.status (ATTIVA/ESTINTA/SOSPESA)

  9.2 Oggetto imponibile (posteggio):

- objectId → trib.objects[].id
- marketId/posteggio → trib.objects[].ref (allinea a concessione)
- mq/tariffa → trib.objects[].metrics

  9.3 Avvisi/pagamenti:

- noticeId → trib.notices[].id
- iuv/pagoPA → trib.notices[].iuv
- amount → trib.notices[].amount
- dueDate → trib.notices[].due_date
- status → trib.notices[].status (EMESSO/PAGATO/SCADUTO)
- payment.date → trib.payments[].date
- payment.txId → trib.payments[].tx_id

**10) Derivazione "Concessione" DMS da SSU o MercaWeb**

Regola: se dalla pratica SUAP (SSU BO) emerge un provvedimento di concessione → costruisci/aggiorna concessione.

| Origine  | Condizione                      | Mapping concessione                                                                               |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| SSU BO   | kind=SCIA_CAP e finalAct.type = | id=cui, issuedBy=boSuap, issuedAt=finalAct.date, validFrom/To da atto o regime, holder da subject |
| MercaWeb | record concessionId presente    | mappa 8.1 1:1 (preferisci MercaWeb per market/posteggio; arricchisci con atti SSU se presenti)    |

**11) Ordine chiamate consigliato (login dashboard)**

1. OIDC SPID/CIE → profilo base
2. AE (P.IVA/CF) → validazione
3. Registro Imprese → anagrafica completa + ruoli/soci
4. INAD/INI-PEC → PEC ufficiale
5. SSU BO → pratiche + timeline (deriva concessioni + SCIA CAP)
6. DURC → stato e scadenza
7. MercaWeb (se attivo) → concessioni/presenze
8. Maggioli (se attivo) → canone/avvisi/pagamenti

**12) Trasformazioni & normalizzazioni**

- CF/P.IVA: uppercase, strip spazi, checksum
- Date: ISO 8601 UTC; salva source_tz se noto
- Enum: mappa vendor → DMS (ATTIVA/SOSPESA/REVOCATA, EMESSO/PAGATO/SCADUTO)
- Indirizzi: split via/civico/cap/city/prov; normalizza province (sigle 2 lettere)
- Join: vat_number è chiave primaria per impresa; cui per pratica; concessionId per MercaWeb; positionId per tributi
- Audit: logga source, timestamp, finalità, id richiesta, esito

**13) Email pronte (vendor)**

A) MercaWeb (sandbox/API) - Richiesta sandbox/API per integrazione DMS mercati/fiere
B) Maggioli Tributi (TRIB Evo/J-TRIB + PDND) - Integrazione DMS con TRIB (Canone Mercatale) + PDND
