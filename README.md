# ESN Team Manager (About Us editor)

Questo progetto è una **monorepo** (gestito con [Turbo](https://turbo.build/) e [pnpm](https://pnpm.io/)) progettato per semplificare la gestione della [pagina "About Us"](https://more.esn.it/?q=about-us) del sito web di **ESN Modena e Reggio Emilia**.

Il sistema permette di sincronizzare i dati da un'istanza Drupal (ESN Satellite è una fork di Drupal) esistente, modificarli tramite un'interfaccia drag-and-drop moderna, gestire il ritaglio delle immagini e generare l'HTML finale pronto per la pubblicazione.

---

## Architettura del progetto

Il monorepo è diviso in due pacchetti principali all'interno della cartella `apps/`:

### Backend (`apps/backend`)

Un'applicazione **NestJS** che funge da bridge tra l'interfaccia utente e il CMS Drupal.

- **Web scraping & automation**: utilizza **Puppeteer** per autenticarsi su Drupal e interagire con il file manager IMCE.
- **HTML parsing**: utilizza **Cheerio** e **JSDOM** per estrarre e manipolare la struttura dei membri dalle card HTML esistenti.
- **Caching**: integra **Redis** (via Keyv) per memorizzare i cookie di sessione di Drupal e il contenuto della pagina, riducendo i tempi di caricamento.
- **Sicurezza**: protetto da **Basic Auth** (configurabile via variabili d'ambiente).

### Frontend (`apps/frontend`)

Una dashboard **React 19** ultra-reattiva costruita con **Vite** e **Tailwind CSS v4**.

- **Visual editing**: gestione dei membri tramite colonne Kanban (Board, Active, Alumni, etc.).
- **Drag & drop**: riordinamento fluido dei membri tra le diverse sezioni.
- **Image editor**: tool integrato per il caricamento e il ritaglio (crop) delle foto dei membri in formato quadrato.
- **Safety first**: include un sistema di generazione di backup obbligatorio prima dell'esportazione e un visualizzatore delle differenze dell'HTML per controllare ogni minima modifica.

---

## Requisiti

- **Node.js**: >= 20.x
- **pnpm**: >= 10.x
- **Redis**: un'istanza attiva per il caching (opzionale, fallback su memoria locale se non configurato).
- **Chrome/Chromium**: necessario per Puppeteer (specialmente in ambienti Linux/Docker).

---

## Installazione e setup

1. **Clona il repository:**

   ```bash
   git clone <repo-url>
   cd about-us-monorepo
   ```

2. **Installa le dipendenze:**

   ```bash
   pnpm install
   ```

3. **Configura le variabili d'ambiente:**
   Crea un file `.env` nella cartella `apps/backend/`:

   ```env
   # Credenziali per l'accesso alla Dashboard (Basic Auth)
   APP_USERNAME=admin
   APP_PASSWORD=una_password_sicura

   # Credenziali Drupal (Satellite/More)
   DRUPAL_USERNAME=tuo_utente
   DRUPAL_PASSWORD=tua_password

   # Configurazione Redis
   REDIS_URL=redis://localhost:6379

   # Path per Puppeteer (necessario su alcuni sistemi Linux/Docker)
   # PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
   ```

---

## Comandi disponibili

Dalla root del progetto:

| Comando      | Descrizione                                                                       |
| :----------- | :-------------------------------------------------------------------------------- |
| `pnpm dev`   | Avvia Backend e Frontend in modalità sviluppo con hot-reload.                     |
| `pnpm build` | Compila entrambi i progetti. Il frontend viene compilato dentro `backend/public`. |
| `pnpm start` | Avvia il server backend in produzione (serve anche il frontend statico).          |
| `pnpm check` | Esegue il linting e la formattazione con **Biome**.                               |

---

## Workflow di lavoro tipico

1. **Sync**: all'apertura, l'app usa Puppeteer per "leggere" l'HTML attuale dal sito Drupal e lo trasforma in JSON.
2. **Edit**: l'utente sposta i membri, aggiunge nuovi volontari o aggiorna i ruoli.
3. **Images**: se viene caricata una nuova foto, l'app la ritaglia localmente e la invia al backend, che la carica via Puppeteer nel folder `members` di Drupal.
4. **Preview**: viene generata una preview dell'HTML. L'utente deve scaricare il **Backup** (file `.html`) del vecchio stato per sicurezza.
5. **Deploy**: l'utente copia il nuovo HTML generato e lo incolla nel campo "Body" del nodo Drupal corrispondente.

---

## Qualità del codice

Il progetto utilizza **Biome** per garantire uno standard di codice elevato e prestazioni di linting istantanee.
Le regole sono configurate per supportare i **Decorators** di NestJS e le nuove API di **React 19**.

---

## Licenza

Questo progetto è rilasciato sotto licenza **GNU GPL v3**. Consulta il file `LICENSE` per i dettagli.

---

**Sviluppato con ❤️ da Alessandro Amella**  
per ESN Modena e Reggio Emilia.
