# audio-transcript-audit-tool

A Google Sheets plugin for validating audio transcripts against internal formatting and style guidelines. Built as a freelance tool for a transcription company.


## What it does

Audit team works directly inside Google Sheets. Each row is a transcript segment with fields like speaker, timestamps, language, accent, emotions, and the transcript text itself. Over time, inconsistencies creep in and working through each sheet is very time consuming.

This plugin adds an **Audit** menu to the sheet.

<p align="center">
<img width="480" alt="image (13)" src="https://github.com/user-attachments/assets/b53f04dc-5408-400d-bf4f-0190151a2afa" />
</p>
<br>
Running an audit sends the sheet data to a FastAPI backend, which runs it through a regex-based validation engine and returns a list of flagged cells with suggested fixes.
<p align="center">
<img width="256" height="1208" alt="Screenshot 2026-03-06 220305" src="https://github.com/user-attachments/assets/c2c814d7-8af5-435c-a2c7-6fa520836ad2" />
</p> 
<br>

Results appear in a sidebar where issues can be reviewed, fixed individually or all at once, ignored, and undone/redone.

<p align="center">
    <img width="512" height="1056" alt="Screenshot 2026-03-06 220356" src="https://github.com/user-attachments/assets/a210b2f9-5b60-47e1-bd5d-f3e87d1545d9" />
</p>
<br><br><br>



## Why it exists

The original approach used an LLM with RAG over the company's guidelines. It was slow, expensive, and hallucinated fixes — not acceptable for a functioning tool in a corporate environment.

Replaced with a deterministic regex engine that's fast, consistent, and fully auditable. The backend lives separately so the validation logic stayed private from the company.

<br><br>
## Stack

**Client** — React sidebar running inside Google Sheets via Google Apps Script. Compiled to a single HTML file with Vite and deployed via clasp. TypeScript throughout.

**Server** — FastAPI. Exposes a single `/audit` endpoint. Accepts sheet context, runs validation, returns corrections. Protected by an API key.

<br><br>
## Architecture

```
Google Sheets
└── GAS (Apps Script)
    ├── Services layer     — raw sheet operations (read, write, highlight, cache)
    ├── Orchestrator       — business logic, versioning, atomic transactions
    └── API surface        — thin top-level wrappers callable by google.script.run

React Sidebar (injected via GAS HtmlService)
├── useAudit               — main state machine
├── useHistory             — undo/redo stack
└── gas-bridge             — Proxy-based typed bridge to google.script.run
```

React is the UI layer only. All sheet mutations go through the GAS orchestrator which handles locking, versioning, and cache invalidation atomically.

Version tracking prevents stale audit data from being applied to a sheet that was manually edited since the last audit.


## Project structure

```
audio-transcript-audit-tool/
│
├── client/                          # React + Google Apps Script
│   ├── src/
│   │   ├── assets/
│   │   ├── client/                  # React sidebar
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── server/                  # Google Apps Script
│   │   │   ├── services.ts          # Sheet + cache operations
│   │   │   ├── orchestrator.ts      # Business logic layer
│   │   │   ├── api.ts               # Public GAS entry points
│   │   │   └── ui.ts                # onOpen, sidebar bootstrap
│   │   └── global.d.ts              # Shared types
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
│
└── server/                          # FastAPI backend
    ├── app/
    │   ├── engine/                  # Regex validation core
    │   │   ├── __init__.py
    │   │   └── deterministic_parser.py
    │   ├── __init__.py
    │   ├── config.py
    │   ├── main.py
    │   ├── routes.py
    │   ├── schema.py
    │   └── utils.py
    └── requirements.txt
```


## Notable decisions

**GAS as the orchestrator** — Early version had React managing versioning, cache writes, and highlight state across multiple sequential GAS calls. Reworked so GAS handles all of that atomically inside `dispatchAction` with a script lock. React only manages UI state.

**Deterministic validation over LLM** — The problem is well-defined enough that regex handles it better. Every rule is explicit, testable, and fast. No hallucinations.

**Single-file client build** — `vite-plugin-singlefile` inlines all JS/CSS into one HTML file. Required for GAS `HtmlService` which can't load external assets.

**Versioning** — Every sheet mutation increments a version stored in a hidden internal sheet. Cached audit results carry the version they were generated against. On load, if versions don't match, the cache is discarded and the user is prompted to re-audit.


## Note

This project was discontinued before reaching production. The repo exists as a reference and portfolio piece.

Running it requires a configured Google Sheet, clasp credentials, and Script Properties (`API_BASE_URL`, `API_KEY`) which are not included.
