# QA Automation

App-agnostic tooling: scrape a website → UI contract JSON → test plans → YAML testcases → Playwright E2E specs.

Includes a **React web UI** and **FastAPI backend**, dockerized for local/dev use.

Aligned with the [fpa-qa-test](../fpa-qa-test/) architecture (testplan → testcases → scripts), but driven by an auto-generated UI contract.

## Quick start (Docker)

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env

docker compose up --build
# UI: http://localhost:3000
# API: http://localhost:8000/api/health
```

## Project structure

```
qa-automation/
  backend/
    app/                  # FastAPI service
    pipeline.py           # Orchestrator
    scraper.py            # Stage 0: crawl → contract JSON
    generators/           # plan, yaml, spec generators
    lib/                  # contract, llm, prompts, overlap, assertions
  frontend/               # React + Vite UI
  data/                   # Persisted storage (gitignored)
    contracts/            # *-contract.json
    output/{app}/         # Generated test repos
    jobs/{id}/            # Job status + logs
  docker-compose.yml
```

## Web UI

| Page | Purpose |
|------|---------|
| **Apps** | List generated apps and recent pipeline jobs |
| **New Run** | Start scrape/plan/yaml/spec pipeline |
| **Job detail** | Live status and logs |
| **Artifacts** | Browse and download generated plans, YAML, specs |

**Human review gates:** Edit test plans before `yaml`. Review YAML before `spec`.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health + OpenAI configured |
| `GET` | `/api/apps` | List apps |
| `GET` | `/api/apps/{slug}` | App manifest |
| `GET` | `/api/apps/{slug}/files` | List artifacts |
| `GET` | `/api/apps/{slug}/files/content?path=` | Read file |
| `GET` | `/api/apps/{slug}/files/download?path=` | Download file/zip |
| `POST` | `/api/jobs/pipeline` | Start pipeline job |
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/{id}` | Job status |
| `GET` | `/api/jobs/{id}/logs?offset=` | Tail logs |

Only one pipeline job runs at a time (returns `409` if busy).

## CLI (without Docker)

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
cp ../.env.example ../.env   # set OPENAI_API_KEY

# Full pipeline (contract in data/contracts/)
python pipeline.py \
  --contract ../data/contracts/bihar-contract.json \
  --app bihar-krishi \
  --steps plan,yaml,spec

# Scrape + generate
python pipeline.py \
  --url https://staging.biharkrishi.in \
  --app bihar-krishi \
  --max-pages 20 \
  --steps all
```

### Run API locally

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run frontend locally

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 (proxies /api to :8000)
```

## Pipeline steps

| Step | Output |
|------|--------|
| `scrape` | `data/contracts/{app}-contract.json` |
| `plan` | `data/output/{app}/tests/testplan/*.md` |
| `yaml` | `data/output/{app}/tests/testcases/{module}/*.yaml` |
| `spec` | `data/output/{app}/tests/scripts/e2e/`, `pages/` |

## Run generated Playwright tests

```bash
cd data/output/bihar-krishi
cp .env.qa.example .env.qa
# Set QA_UI_BASE_URL=https://staging.biharkrishi.in
npm install
npx playwright install chromium
npm run test:smoke
```

## Contract JSON (`contract_version: 1.0.0`)

Produced by [backend/scraper.py](backend/scraper.py). See [QA-Implementation-Guide.docx](QA-Implementation-Guide.docx) for the full AI-assisted QA workflow.

## Legacy

[backend/test_generator.py](backend/test_generator.py) is **deprecated** — page-level stubs. Use `pipeline.py` + `generators/spec_generator.py` for flow-based E2E tests.
