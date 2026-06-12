# QA Automation Process

End-to-end flow from scraping an app to triaging test failures.

**Prerequisite:** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and logged in on your machine (`claude` on PATH). Python code shells out to `claude -p` — no API key when working locally.

Run each step in **Claude Code** or **Cursor** using the matching command in `.claude/commands/`.

## 1. Scrape the website

- Initial scrape: `/rescrape <app>` or from `backend/`:
  ```bash
  python scraper.py {url} --output ../data/contracts/{app}-contract.json --max-pages 30
  ```
- Re-scrapes: `/rescrape <app>` (merge mode by default)
- Two-pass crawl: anonymous pass, then authenticated when `QA_LOGIN_URL` + credentials are set in `.env`
- Add `seed_paths` in `data/output/{app}/workspace.json` for pages not linked from the entry URL
- Headed browser (debug): run scraper on the host with Playwright headed, or pass `--headed` if supported
- Output: `data/contracts/{app}-contract.json`. Re-scrapes merge into the existing contract (stale elements kept) and write `{app}-contract-diff.md`

### Scraper auth (`.env`)

| Variable | Purpose |
|----------|---------|
| `QA_LOGIN_URL` | Canonical login page |
| `QA_USERNAME` / `QA_PASSWORD` | Password flow |
| `QA_TEST_MOBILE` / `QA_TEST_OTP` | OTP flow |

Optional tuning: `QA_NAVIGATION_TIMEOUT_MS`, `QA_BUTTON_PROBE_LIMIT`

## 2. Add API/Swagger contract

Manually drop the swagger/API contract into the output contract folder if needed.

## 3. Generate test plans

- `/testplan-gen <module>` or pipeline `plan` step
- Output: `data/output/{app}/tests/testplan/{module}.md`

## 4. Generate test cases

- Run `/overlap-analysis <module>` when adding a new module
- Then `/testcase-gen <module>` or pipeline `yaml` step
- Output: YAML under `tests/testcases/{module}/`

## 5. Check for missing selectors

- `/selector-audit [module]` — missing/stale/ambiguous selectors and auth gaps

## 6. Fix missing selectors

- **Preferred: re-scrape** via `/rescrape <app>` — merge scrape + diff report
- Manual contract edits only for elements the scraper cannot capture

## 7. Generate test scripts

- `/playwright-gen <module> <FLOW-ID>` → E2E specs + POMs
- `/script-gen <module> <FLOW-ID>` → API/integration specs

## 8. Fill fixtures & seed data

- `/fixture-fill <module>` populates fixture stubs

## 9. Run tests & triage

- `/run-tests [module | FLOW-ID | @tag]` — runs from `data/output/{app}/`
- `/triage` — classify failures and route to the right fix command
