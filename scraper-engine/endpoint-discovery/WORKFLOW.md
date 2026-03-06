# Mandi AI Agent — Workflow & Architecture

This document serves as the definitive technical guide for the Mandi Scraper Agent. The system is designed to autonomously discover, map, and scrape agricultural market price data from disparate government portals using a resilient, multi-stage pipeline powered by LLMs and asynchronous I/O.

## 1. High-Level Architecture

The agent operates as a modular CLI tool with distinct layers for orchestration, discovery, scraping, and AI analysis.

```mermaid
graph TD
    CLI[CLI / Cron] -->|Trigger| Main[main.py]
    Main -->|Config| Runner[app.core.runner]
    
    subgraph "Core Agent Loop"
        Runner -->|Mode: Discover| Discovery[Discovery Engine]
        Runner -->|Mode: Scrape| Scraper[Scrape Engine]
        Runner -->|Mode: Single URL| Single[Single URL Handler]
    end
    
    subgraph "AI Layer (LangChain)"
        Discovery -->|HTML/Net Logs| AI_Discover[AI Discovery Mode]
        Scraper -->|Sample Data| AI_Map[AI Mapping Mode]
        AI_Discover -->|LLM| LLM_Factory[LLM Factory]
        LLM_Factory -->|Failover| Provider[Google / OpenAI / OpenRouter]
    end
    
    subgraph "Data Layer (MongoDB)"
        Sources[Sources Collection]
        Prices[Prices Collection]
        Runs[Scrape Runs Log]
    end
    
    Discovery -->|Save Config| Sources
    Scraper -->|Read Config| Sources
    Scraper -->|Write Data| Prices
    Single -->|Read/Write| Sources
```

## 2. Detailed Workflows

### A. Discovery Workflow (`mode="discover"`)
*Goal: Find out HOW to scrape a new website without human coding.*

```mermaid
flowchart TD
    Start([Start Discovery]) --> Init[Initialize Playwright<br/>Headless Browser]
    Init --> Navigate[Navigate to Target URL]
    Navigate --> Sniff[Attach Network Listeners<br/>XHR/Fetch Detection]

    subgraph Crawl[Heuristic Crawl Phase]
        Sniff --> Queue[Priority Queue<br/>heapq]
        Queue --> L0{Check Links}
        L0 -->|PDF/XLS Files| L0_Collect[Collect Downloads]
        L0 -->|Market/Rate/Price| L1_Collect[Collect L1 Links]
        L0 -->|General Nav| L2_Collect[Collect L2 Links]
        L0_Collect & L1_Collect & L2_Collect --> Queue
    end

    subgraph Detect[Content Detection]
        Queue --> TableDetect[TableDetector<br/>>3 rows + headers]
        Queue --> FileDetect[FileDetector<br/>Downloadable Assets]
        TableDetect & FileDetect --> Findings[Aggregate Findings]
    end

    subgraph AI[AI Analysis]
        Findings --> Context[Compress to JSON Context]
        Context --> Prompt[LLM Prompt<br/>ExtractionConfig Schema]
        Prompt --> Score{Score Methods}
        Score -->|Score 1.0| API_Pref[API Preferred]
        Score -->|Score 0.7| HTML_Fallback[HTML Table Fallback]
        Score -->|Score 0.4| File_Last[File Last Resort]
        API_Pref & HTML_Fallback & File_Last --> Validate[Validate Config<br/>Reject Hallucinations]
    end

    Validate --> Save[Save ExtractionConfig<br/>to Sources Collection]
    Save --> End([End])

    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#f44336,stroke:#c62828,color:#fff
    style Crawl fill:#E3F2FD,stroke:#1976D2
    style Detect fill:#FFF3E0,stroke:#F57C00
    style AI fill:#F3E5F5,stroke:#7B1FA2
```

### B. Mapping Workflow (Implicit in Discovery/First Scrape)
*Goal: Semantic understanding of column names.*

```mermaid
flowchart LR
    Start([Start Mapping]) --> DryRun[Dry Run Scrape<br/>5 Sample Records]

    subgraph Extract[Sample Extraction]
        DryRun --> RawKeys[Extract Raw Keys<br/>e.g., Orchard_Name, Rate_Min, dt]
    end

    subgraph AI_Map[AI Mapping]
        RawKeys --> Prompt[LLM Prompt<br/>SchemaMapping Schema]
        Prompt --> Logic{Mapping Logic}
        Logic -->|Field Mapping| Unified[Map to Price Schema<br/>minPrice, maxPrice, cropName]
        Logic -->|Conversions| ConvRules[FieldConversion Rules<br/>multiply: 100, date formats]
    end

    subgraph Persist[Persistence]
        Unified & ConvRules --> Update[Update Source Document<br/>schemaMapping + conversions]
    end

    Update --> End([End])

    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#f44336,stroke:#c62828,color:#fff
    style AI_Map fill:#F3E5F5,stroke:#7B1FA2
    style Persist fill:#E8F5E9,stroke:#388E3C
```

### C. Scrape Workflow (`mode="scrape"`)
*Goal: High-volume production extraction.*

```mermaid
flowchart TD
    Start([Start Scrape]) --> Load[Load Active Sources<br/>MongoDB or CSV]

    subgraph Dispatch[Scrape Engine Dispatch]
        Load --> Type{Config Type}

        Type -->|API| API_Scrape[API Scraper<br/>httpx.AsyncClient]
        Type -->|HTML| HTML_Scrape[HTML Scraper<br/>httpx + BeautifulSoup]
        Type -->|File| File_Scrape[File Scraper<br/>pdfplumber / openpyxl]

        API_Scrape --> API_Feat[Pagination Support<br/>POST JSON/Form Data]
        HTML_Scrape --> HTML_Feat[pandas.read_html<br/>StringIO Wrapper]
        File_Scrape --> File_Feat[Temp Download<br/>PDF/Excel Extraction]
    end

    subgraph Normalize[Data Normalization]
        API_Feat & HTML_Feat & File_Feat --> Rename[Rename Fields<br/>schemaMapping]
        Rename --> Convert[Execute Conversions<br/>Math & String Cleaning]
        Convert --> DateParse[Parse Dates<br/>dateutil + Format Strings]
        DateParse --> Validate{Validate<br/>Mandatory Fields}
        Validate -->|Pass| Continue[Continue]
        Validate -->|Fail| Drop[Drop Record]
    end

    subgraph Save[Persistence]
        Continue --> Bulk[bulk_write<br/>UpdateOne upsert]
        Bulk --> Key[Composite Key<br/>sourceId+date+cropName+mandiName]
    end

    Drop --> Key
    Key --> End([End])

    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#f44336,stroke:#c62828,color:#fff
    style Dispatch fill:#E3F2FD,stroke:#1976D2
    style Normalize fill:#FFF3E0,stroke:#F57C00
    style Save fill:#E8F5E9,stroke:#388E3C
```

### D. Single URL Workflow (`mode="single_url" --url ...`)
*Goal: One-shot onboarding.*

```mermaid
flowchart TD
    Start([Start Single URL]) --> Lookup[Check DB for entryUrl]

    Lookup --> Found{Source Exists?}

    Found -->|Yes| LoadConfig[Load Config<br/>from Sources]
    Found -->|No| Discovery[Run Discovery Workflow]

    Discovery --> Mapping[Run Mapping Workflow]
    Mapping --> ScrapeNew[Run Scrape Workflow]

    LoadConfig --> ScrapeExisting[Run Scrape Workflow]

    ScrapeNew & ScrapeExisting --> Save[Save Results<br/>Prices Collection]

    Save --> End([End])

    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#f44336,stroke:#c62828,color:#fff
    style Discovery fill:#F3E5F5,stroke:#7B1FA2
    style Mapping fill:#E3F2FD,stroke:#1976D2
    style ScrapeNew fill:#FFF3E0,stroke:#F57C00
    style ScrapeExisting fill:#FFF3E0,stroke:#F57C00
    style Save fill:#E8F5E9,stroke:#388E3C
```

## 3. Configuration & Environment

The agent uses a frozen `AppConfig` dataclass populated by `.env` and CLI args.

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Connection String | — |
| `DB_NAME` | Database Name | `mandi_insights` |
| `LLM_PROVIDER` | `google`, `openai`, `openrouter` | `google` |
| `GOOGLE_API_KEY` | For Gemini models | — |
| `OPENROUTER_API_KEY` | For OpenRouter | — |
| `OPENROUTER_MODEL` | Comma-separated model list for failover | `google/gemini-2.0-flash-001` |
| `HEADLESS` | Run browser without UI | `true` |

## 4. Resilience & Error Handling

### LLM Robustness
*   **Failover Chain**: When using `OPENROUTER`, you can provide a list of models (e.g., `mistral-7b,gemini-2.0,phi-3`). The factory creates a `RunnableWithFallbacks` that automatically retries with the next model upon failure (429, 404, 500).
*   **Structured Output Fallback**: Many free models do not support OpenAI's "JSON Mode" or "Tool Calling". The agent implements a custom parser that:
    1.  Injects a strict JSON schema instruction into the user prompt.
    2.  Uses Regex to strip Markdown fences (` ```json ... ``` `) and "thinking" blocks (`<think>...`).
    3.  Validates the raw string using Pydantic `model_validate_json`.

### Scraping Robustness
*   **HTML Parsing**: `pandas.read_html` can crash on large strings if interpreted as filenames. The agent wraps content in `io.StringIO`.
*   **Hallucination Guard**: Pydantic validators reject AI-generated CSS selectors that contain HTML tags (e.g., `<div...`).
*   **Async/Await**: All network I/O (DB, HTTP, Playwright) is asynchronous to maximize throughput.

### Database Health
*   **Connection Check**: Gracefully degrades to text logging if MongoDB is unreachable.
*   **Health Monitoring**: Tracks consecutive failures. Sources are marked `BROKEN` after 3 failed runs, preventing wasted resources.

## 5. File System Structure

*   **`main.py`**: Entry point & DI container.
*   **`config.py`**: Configuration logic.
*   **`app/core/`**:
    *   `runner.py`: Main control loop.
    *   `context.py`: Request-scoped context (logger, stats).
*   **`app/discovery/`**:
    *   `crawler.py`: Playwright logic.
    *   `network_sniffer.py`: API detection.
*   **`app/scraping/`**:
    *   `scrape_engine.py`: Dispatcher.
    *   `html_scraper.py`, `api_scraper.py`: Implementations.
*   **`app/ai/`**:
    *   `llm.py`: Factory & Failover logic.
    *   `prompts.py`: Prompt templates.
*   **`app/inputs/`**, **`app/outputs/`**: I/O Adapters.

## 6. Usage Examples

**Production Run** (Cron Job)
```bash
# Runs scraping for all active sources in DB
python3 main.py --mode scrape --log mongo
```

**Onboard New Source**
```bash
# Auto-discovers config, maps schema, scrapes data, and saves to DB
python3 main.py --url https://www.apmcnagpur.com/
```

**Debug Mode** (No DB writes)
```bash
# Writes outputs to local CSV/JSON files
python3 main.py --input csv --log txt --url https://example.com
```
