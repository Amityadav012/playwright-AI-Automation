Re-scrape the app to refresh the contract (merge mode), then summarize the diff and its impact on existing test cases. Usage: /rescrape <app> [seed paths, comma-separated]

---

## Setup

1. Read `data/output/{app}/workspace.json` → base URL, `contract_path`, existing `seed_paths`.
   Contract default: `data/contracts/{app}-contract.json`.
2. Merge seed paths: workspace.json `seed_paths` + any paths given in $ARGUMENTS.
3. Load auth from `.env` via `load_scraper_credentials()` — never hardcode or echo secrets.

Required for auth scrape:

- `QA_LOGIN_URL`
- `QA_TEST_MOBILE` + `QA_TEST_OTP` (OTP apps) **or** `QA_USERNAME` + `QA_PASSWORD`

---

## Run the scrape

From repo root (`qa-automation/`):

```bash
cd backend
python scraper.py {base_url} \
  --output ../data/contracts/{app}-contract.json \
  --seed-paths {paths} \
  --max-pages 30
```

Or via pipeline (reads workspace `seed_paths` when `--seed-paths` omitted):

```bash
python pipeline.py --app {app} --url {base_url} --steps scrape --max-pages 30
```

Merge mode is the default — do NOT pass `--no-merge` unless the user explicitly asks to overwrite.

Optional flags:

- `--no-interact` — skip dropdown/menu expansion pass
- `--probe-common-paths` — probe `/sitemap`, `/faq`, etc. (off by default)

Tune speed while debugging: `QA_BUTTON_PROBE_LIMIT=5` in `.env`.

**Prerequisite:** `claude` CLI installed and logged in on the host (no API key for local runs).

---

## After the scrape

1. Read `{app}-contract-diff.md` next to the contract (if merge ran).
2. Summarize pages/elements added vs stale.
3. Grep testcases/specs for stale element IDs if the diff lists element changes.
4. Suggest `/selector-audit` or `/playwright-gen` for affected flows.
