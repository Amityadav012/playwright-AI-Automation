# Website Scraper + Test Generator

Two functions that work together:
1. `scraper.py` — crawls a website and outputs a `site_map.json`
2. `test_generator.py` — reads that JSON and generates Playwright TypeScript test stubs

---

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Fill in your OPENAI_API_KEY in .env
```

---

## Step 1 — Scrape the website

### Public site only
```bash
python scraper.py https://yourapp.com
```

### Site with login (for protected pages)
```bash
python scraper.py https://yourapp.com \
  --login-url https://yourapp.com/login \
  --username admin@yourapp.com \
  --password yourpassword \
  --max-pages 30
```

Output: `site_map.json`

---

## Step 2 — Generate tests

```bash
python test_generator.py --sitemap site_map.json --output generated_tests
```

Only high priority pages:
```bash
python test_generator.py --priority high
```

Output: `generated_tests/*.spec.ts` + `generated_tests/_index.json`

---

## Use as a Python module

```python
from scraper import scrape_website
from test_generator import generate_all_tests

# Step 1: scrape
scrape_website(
    base_url="https://yourapp.com",
    output_path="site_map.json",
    login_url="https://yourapp.com/login",
    username="admin@yourapp.com",
    password="secret",
    max_pages=30,
)

# Step 2: generate tests
generate_all_tests(
    sitemap_path="site_map.json",
    output_dir="generated_tests",
    priority_filter="all",  # or "high" / "medium" / "low"
)
```

---

## Contract JSON structure (`contract_version: 1.0.0`)

```json
{
  "contract_version": "1.0.0",
  "application": { "name": "My App", "base_url": "https://yourapp.com" },
  "extraction_metadata": { "tool": "qa-automation/scraper.py", "scraped_at": "...", "total_pages": 12 },
  "route_index": [
    { "page_id": "login", "path": "/login", "url": "https://yourapp.com/login", "test_priority": "high" }
  ],
  "pages": [
    {
      "page_id": "login",
      "path": "/login",
      "url": "https://yourapp.com/login",
      "title": "Login",
      "description": "User authentication page",
      "page_type": "login",
      "test_priority": "high",
      "elements": [
        {
          "element_id": "login_button",
          "role": "button",
          "label": "Login",
          "description": "Submits mobile number to start authentication",
          "selectors": {
            "playwright": "page.getByRole('button', { name: 'Login' })",
            "xpath": "//button[@id='submitButton']"
          }
        }
      ],
      "forms": [
        {
          "form_id": "mobile_login",
          "description": "Farmer login form using mobile number",
          "fields": [
            {
              "field_id": "mobile",
              "label": "Mobile number",
              "description": "Registered DBT or DFS mobile number",
              "selectors": { "playwright": "page.locator('#user_mobile')", "xpath": "//input[@id='user_mobile']" }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## How the LLM is used

| Where | What it does |
|---|---|
| `decide_which_urls_to_crawl` | Picks important pages, skips duplicates/noise |
| `analyze_page` | Classifies page type, assigns test priority, detects auth |
| `generate_tests_for_page` | Writes Playwright TypeScript test stubs using real XPaths |
