# QA Automation

App-agnostic tooling: scrape a website → UI contract JSON → test plans → YAML testcases → Playwright E2E specs.

Includes a **React web UI** and **FastAPI backend**, dockerized for local/dev use.

## Quick start (Docker)

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env

docker compose up --build
# UI: http://localhost:3000
# API: http://localhost:8000/api/health
```

## Intent-driven workflow (default)

1. **Extract Contract** — crawl target URL (`POST /api/jobs/scrape`). No plans or specs are generated automatically.
2. **App Workspace** — describe what you want to test in plain language.
3. **Generate Test Plan** — one focused plan per request (scoped to your intent).
4. **Generate Test Case** — select a plan from the dropdown, then generate YAML.
5. **Generate Playwright** — select a test case, then generate the E2E spec.

Artifact hierarchy per plan:

```
data/output/{app}/
  workspace.json
  tests/testplan/{plan_id}.md
  tests/testcases/{plan_id}/{FLOW-ID}.yaml
  tests/scripts/e2e/{plan_id}/{FLOW-ID}.e2e.spec.ts
```

## Web UI

| Page | Purpose |
|------|---------|
| **Apps** | List apps; open Workspace or Artifacts |
| **Extract Contract** | Scrape target URL → contract JSON only |
| **Workspace** | Intent input + cascading plan → testcase → Playwright dropdowns |
| **Job detail** | Live status and logs |
| **Artifacts** | Browse and download all generated files |

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health + OpenAI configured |
| `GET` | `/api/apps` | List apps |
| `GET` | `/api/apps/{slug}/workspace` | Plan/testcase/spec hierarchy for dropdowns |
| `GET` | `/api/apps/{slug}/contract` | Contract metadata |
| `POST` | `/api/jobs/scrape` | Extract contract only |
| `POST` | `/api/apps/{slug}/generate/plan` | `{ user_intent }` |
| `POST` | `/api/apps/{slug}/generate/testcase` | `{ plan_id }` |
| `POST` | `/api/apps/{slug}/generate/spec` | `{ plan_id, flow_id }` |
| `POST` | `/api/jobs/pipeline` | Legacy full pipeline (optional) |
| `GET` | `/api/jobs/{id}/logs` | Tail logs |

Only one job runs at a time (returns `409` if busy).

## CLI (without Docker)

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
cp ../.env.example ../.env

# Scrape only
python pipeline.py --url https://dfsqa.beehyv.com --app dfsqa --steps scrape

# Full pipeline (legacy)
python pipeline.py \
  --contract ../data/contracts/bihar-contract.json \
  --app bihar-krishi \
  --steps plan,yaml,spec
```

## Project structure

```
qa-automation/
  backend/
    app/                  # FastAPI service
    lib/workspace.py      # Plan registry (workspace.json)
    pipeline.py
    scraper.py
    generators/
  frontend/
  data/
    contracts/
    output/{app}/
    jobs/
  docker-compose.yml
```

## Run generated Playwright tests

```bash
cd data/output/{app}
cp .env.qa.example .env.qa
npm install && npx playwright install chromium
npm run test:smoke
```
