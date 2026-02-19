# ESN Team Manager — Dashboard Web

Mini app per gestire visualmente i membri del team ESN.

## Struttura

```
about-us-editor/          ← la tua cartella esistente
├── manage-about-us.ts    ← la tua classe (invariata)
├── about-us.html         ← il file HTML da gestire
├── server.ts             ← il nuovo backend Express  ← AGGIUNTO
└── sites/...             ← le immagini (invariate)

esn-team-manager/         ← la nuova cartella frontend
├── src/
│   ├── main.tsx
│   └── App.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Setup (una tantum)

### 1. Backend (dentro `about-us-editor/`)

Copia `server.ts` nella tua cartella `about-us-editor/` (accanto a `manage-about-us.ts`).

Installa le dipendenze mancanti:

```bash
cd about-us-editor
npm install express cors multer
npm install -D @types/express @types/cors @types/multer ts-node
```

Avvia il server:

```bash
npx ts-node server.ts
# oppure, se hai già tsx/ts-node configurato:
# npx tsx server.ts
```

Il server parte su **http://localhost:3000**.

### 2. Frontend (dentro `esn-team-manager/`)

```bash
cd esn-team-manager
npm install
npm run dev
```

Si apre su **http://localhost:5173**.

## Utilizzo

- **Trascina** una card per riordinarla o spostarla tra sezioni
- Clicca **✏️** per modificare nome, ruolo e foto
- **＋** in testa alla colonna per aggiungere un nuovo membro
- **💾 Salva HTML** per scrivere le modifiche su `about-us.html`
  - Viene creato automaticamente un backup `about-us_backup_TIMESTAMP.html`

## Note

- Le immagini devono stare in `about-us-editor/sites/esnmodena.it/files/members/`
- Il backend serve le immagini su `/members-img/` per la preview nella dashboard
- L'URL del backend è configurato in `App.tsx` nella costante `API_BASE`
