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
6. **Play** — run the selected spec in a visible Chromium window (headed Docker profile).

Artifact hierarchy per plan:

```
data/output/{app}/
  workspace.json
  tests/testplan/{plan_id}.md
  tests/testcases/{plan_id}/case.yaml
  tests/scripts/e2e/{plan_id}/case.e2e.spec.ts
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
| `POST` | `/api/apps/{slug}/run/spec` | `{ plan_id, spec_path? }` — headed Playwright run |
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

## Contract schema (v1.1.0)

Extract Contract writes `contract_version: 1.1.0` JSON with:

- **Per-element**: `raw_href`, `fragment`, `region` (`header` | `footer` | `nav` | `content`), and `target_path` (includes `/#fragment` for in-page links)
- **`home_navigation`**: header/footer/nav links visible on `/`, each with `assert: { kind, value }` for Playwright URL checks

v1.0.0 contracts still load; navigation tests work best after re-extracting so `home_navigation` is populated.

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

## Run generated Playwright tests (UI — headed browser)

The workspace **Play** button runs the selected spec with a visible Chromium window on your Linux desktop.

**One-time host setup:**

```bash
xhost +local:docker
```

**Start with headed profile** (X11 forwarding into the backend container):

```bash
docker compose -f docker-compose.yml -f docker-compose.headed.yml up -d --build
```

Then open the workspace, select a plan with a generated spec, and click **Play**. The first run may take 1–2 minutes while `npm install` and `playwright install chromium` complete under `data/output/{app}/`.

Without the headed profile, Play returns a clear error (`PLAYWRIGHT_HEADED is not enabled`).

**Limitations:** Linux desktop with X11 or XWayland. Headless servers cannot show a window. Wayland-only setups may need `DISPLAY=:0`.

## Run generated Playwright tests (CLI)

```bash
cd data/output/{app}
cp .env.qa.example .env.qa
# Edit QA_UI_BASE_URL if needed
npm install && npx playwright install chromium
npx playwright test tests/scripts/e2e/{plan_id}/case.e2e.spec.ts --headed
```
