# QA Automation Pipeline

App-agnostic tooling: scrape a website → UI contract JSON → test plans → YAML testcases → Playwright E2E specs.

Aligned with the [fpa-qa-test](../fpa-qa-test/) architecture (testplan → testcases → scripts), but driven by an auto-generated UI contract.

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Set OPENAI_API_KEY in .env
```

## Full pipeline

```bash
# Option A: contract already exists
python pipeline.py \
  --contract bihar-contract.json \
  --app bihar-krishi \
  --steps plan,yaml,spec

# Option B: scrape first, then generate
python pipeline.py \
  --url https://staging.biharkrishi.in \
  --contract bihar-contract.json \
  --app bihar-krishi \
  --max-pages 20 \
  --steps all
```

### Pipeline steps

| Step | Command | Output |
|------|---------|--------|
| `scrape` | `scraper.py` | `{app}-contract.json` |
| `plan` | `generators/test_plan_generator.py` | `output/{app}/tests/testplan/*.md` |
| `yaml` | `generators/testcase_generator.py` | `output/{app}/tests/testcases/{module}/*.yaml` |
| `spec` | `generators/spec_generator.py` | `output/{app}/tests/scripts/e2e/`, `pages/` |

**Human review gates:** Edit test plans before `yaml`. Review YAML before `spec`. Review generated specs before commit.

### Run generated tests

```bash
cd output/bihar-krishi
cp .env.qa.example .env.qa
# Set QA_UI_BASE_URL=https://staging.biharkrishi.in
npm install
npx playwright install chromium
npm run test:smoke
```

## Individual generators

```bash
# 1. Scrape → contract
python scraper.py https://yourapp.com --output myapp-contract.json --max-pages 20

# 2. Test plans
python -m generators.test_plan_generator --contract myapp-contract.json --app my-app

# 3. YAML testcases
python -m generators.testcase_generator --contract myapp-contract.json --app my-app

# 4. Playwright specs + POMs
python -m generators.spec_generator --contract myapp-contract.json --app my-app
python -m generators.spec_generator --contract myapp-contract.json --app my-app --flow AUTH-01
```

## Output layout

```
output/{app}/
  manifest.json
  playwright.config.ts
  package.json
  tests/
    testplan/           # Markdown plans (human-editable)
    testcases/          # YAML DSL (review before codegen)
    scripts/
      e2e/{module}/     # Generated *.e2e.spec.ts
      pages/            # Generated *.page.ts
      helpers/          # Scaffolded auth/env stubs
```

## Contract JSON (`contract_version: 1.0.0`)

Produced by [scraper.py](scraper.py). See [QA-Implementation-Guide.docx](QA-Implementation-Guide.docx) for the full AI-assisted QA workflow.

```json
{
  "contract_version": "1.0.0",
  "application": { "name": "My App", "base_url": "https://yourapp.com" },
  "route_index": [{ "page_id": "home", "path": "/", "test_priority": "high" }],
  "pages": [{
    "page_id": "home",
    "elements": [{ "element_id": "login_btn", "label": "Login", "description": "...", "selectors": { "playwright": "..." } }],
    "forms": [{ "form_id": "login", "fields": [{ "field_id": "mobile", "description": "..." }] }]
  }]
}
```

## Legacy

[test_generator.py](test_generator.py) is **deprecated** — it generates page-level stubs directly from the contract. Use `pipeline.py` + `generators/spec_generator.py` for flow-based E2E tests.

## Project structure

```
qa-automation/
  scraper.py              # Stage 0: crawl → contract JSON
  pipeline.py             # Orchestrator
  lib/                    # contract, llm, prompts, overlap, assertions
  generators/
    test_plan_generator.py
    testcase_generator.py
    spec_generator.py
  output/                 # Generated per-app artifacts (gitignored)
```
