# Blueprint correzione notifiche corso con link diretto

## Obiettivo

La correzione deve rendere la notifica corso coerente su tutto il flusso. Quando un’associazione o un ente formatore invia una notifica alle imprese iscritte a un corso, il link o la sede configurati nel popup devono essere salvati in modo persistente, devono arrivare all’app impresa e devono produrre un’azione dedicata **Apri link corso**. Parallelamente, nel pannello dell’associazione o dell’ente l’invio deve comparire tra gli **Inviati**, non tra i **Ricevuti**, con una riga o evidenza per ciascuna impresa destinataria.

## Interventi previsti

| Area | Modifica | Criterio di sicurezza |
|---|---|---|
| Frontend PA | Rendere controllati i campi link/sede dei popup corso in Enti Formatori e Associazioni | Non si modifica il flusso notifiche generico; si interviene solo quando `target_tipo === CORSO` |
| Backend notifiche | Esportare nei messaggi inviati anche `link_riferimento` e `destinatari_dettaglio` | La query mantiene i conteggi esistenti e aggiunge solo campi informativi |
| App impresa | Riconoscere notifiche corso e sostituire le azioni generiche con `Apri link corso` | Le azioni esistenti restano disponibili per notifiche non corso |
| Visualizzazione Inviati | Espandere lato frontend gli invii con dettaglio destinatari per impresa | In assenza di dettagli, resta il comportamento aggregato precedente |

## Verifica

La validazione richiede build frontend e controllo sintattico backend. Dopo commit e push, il deploy automatico aggiornerà Vercel; per il backend sarà necessario allineare l’ambiente remoto con pull e restart del processo applicativo.
