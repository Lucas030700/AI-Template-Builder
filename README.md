# ForgeAI / AI Template Builder Prototype

A first interactive UI prototype for an AI-assisted web application builder.

## What works in this prototype
- Editable project purpose and project name
- Sample interactive household-planner canvas
- Select components and edit title, value, description, width, and visibility
- Add metric, task, note, and chart components
- Reorder, hide, restore, and delete components
- AI chat panel with a small local command interpreter
- Undo and redo for component edits
- Desktop/mobile preview frame
- JSON project-spec export
- Finalization review dialog

## What is intentionally not connected yet
- Real LLM provider / AI-generated code
- Sandboxed execution of arbitrary generated code
- Full drag-and-drop canvas
- Persistent database and user accounts
- GitHub OAuth, repository creation, commits, and push
- Automated build, tests, and security scanning

The UI clearly labels these as future integrations. The current chat uses deterministic demo commands and does not call an AI model.

## Requirements
- Node.js 20 or newer
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Build
```bash
npm run build
```

## Recommended production architecture
- Frontend: React + TypeScript + Tailwind
- Backend: Python + FastAPI
- Database: SQLite for local-first MVP; PostgreSQL for hosted multi-user use
- AI orchestration: provider adapter supporting cloud APIs and Ollama
- Project representation: versioned JSON schema / component tree
- Preview: isolated iframe with a strict sandbox and separate origin
- GitHub: OAuth App or GitHub App with least-privilege repository permissions

## Important safety and reliability design
1. Treat generated code as untrusted.
2. Never execute generated code inside the builder's privileged origin.
3. Run preview/build jobs in an isolated environment with resource limits.
4. Keep provider keys and GitHub tokens on the backend, never in browser code.
5. Require explicit approval before publishing or overwriting a repository.
6. Store immutable project snapshots so users can roll back.


## Phase 2 additions
- Drag-and-drop reordering of canvas components
- Grid/free layout mode selector (free mode is currently a layout preference, with full freeform positioning planned later)
- Local browser persistence using localStorage
- Show hidden components toggle in Layers

This remains a frontend prototype. The AI chat is a demo command interpreter, not a connected model. GitHub publishing and full generated source-code builds are not yet connected.
