# Mandi AI Scraper Agent

AI-powered scraper for Indian agricultural market (mandi/APMC) price data. Uses Playwright for crawling, LangChain for intelligent discovery and schema mapping, and writes normalized data to MongoDB.

## Quick Start

```bash
cd scraper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env  # fill in credentials
```

## Usage

```bash
# Discover + scrape all sources from MongoDB
python3 main.py

# Single URL (auto-discovers config if not in DB)
python3 main.py --url https://agmarknet.gov.in/SearchCmmMkt.aspx

# CSV mode for offline testing
python3 main.py --input csv --log txt --mode scrape

# Discovery only (no scraping)
python3 main.py --mode discover
```

### CLI Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--mode` | `scrape`, `discover`, `discover_and_scrape`, `single_url` | `discover_and_scrape` | Agent execution mode |
| `--url` | URL string | — | Target URL (implies `single_url` mode) |
| `--input` | `mongo`, `csv` | `mongo` | Source loading mode |
| `--log` | `mongo`, `txt` | `mongo` | Logging backend |
| `--headless` | `true`, `false` | `true` | Browser visibility |

## Architecture

```
main.py → config.py → runner.py
                         ├── discover → crawler + sniffer + detectors → AI discovery → save config
                         ├── scrape   → api/html/file scraper → normalizer → save prices
                         └── single_url → check DB → discover if needed → scrape
```

### Key Modules

| Module | Responsibility |
|--------|---------------|
| `app/env/` | Dual `.env` loading (CWD overrides parent) |
| `app/core/` | Runner, context, constants |
| `app/db/` | Async MongoDB (Motor) — `sources`, `scrape_runs`, `prices`, `crops`, `states`, `mandis` |
| `app/queue/` | Multi-level priority queue (L0-L3) for URL exploration |
| `app/discovery/` | Playwright crawler, XHR sniffer, table/file detectors |
| `app/ai/` | LangChain — discovery mode (find extraction strategy) + mapping mode (generate schema) |
| `app/scraping/` | API (httpx), HTML (bs4+pandas), PDF/Excel (pdfplumber+openpyxl), normalizer |
| `app/logging/` | Configurable: MongoDB or text file |
| `app/monitoring/` | Health status: OK / STALE / BROKEN |

## Agent Modes

**Discover** — Crawl a portal with Playwright, sniff XHR calls, detect tables/files, then use AI to select the best extraction method (API > HTML table > PDF/Excel).

**Mapping** — After discovery, scrape sample data and use AI to generate a `schemaMapping` that maps raw fields to the unified `Price` schema. Saved permanently for daily reuse.

**Scrape** — Replay the discovered config (API endpoint, HTML selector, or file URL), normalize output through the schema mapping, and save to MongoDB.

## LLM Support

Set `LLM_PROVIDER` in `.env`:

| Provider | Model | Env Var |
|----------|-------|---------|
| `google` (default) | Gemini 2.0 Flash | `GOOGLE_API_KEY` |
| `openai` | GPT-4o Mini | `OPENAI_API_KEY` |

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `sources` | Portal configs, extraction strategies, health metadata |
| `scrape_runs` | Run history (duration, URLs visited, record counts, errors) |
| `prices` | Normalized mandi price records |
| `crops` | Unique crops (derived from prices) |
| `states` | Unique states (derived from prices) |
| `mandis` | Unique mandis with coordinates (derived from prices) |

## Requirements

- Python 3.12+
- Chromium (installed via `playwright install chromium`)
- MongoDB (Atlas or local)
