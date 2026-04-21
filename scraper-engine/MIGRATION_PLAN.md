# Scraper Engine Migration Plan

## Objective
Migrate the `scraper-engine/endpoint-discovery` (currently in Python/LangChain) into the unified TypeScript codebase (`server/`), leveraging the `PI Agent SDK` for LLM-driven discovery and mapping, and utilizing `MongoDB` as the long-term memory and session store.

---

## 1. Architectural Changes

### Current vs. Target Architecture
| Component | Current (Python) | Target (TypeScript) |
|-----------|------------------|---------------------|
| **Core Logic** | Python (`main.py`, `runner.py`) | TypeScript (`server/src/services/scraper/`) |
| **Agent / LLM** | LangChain (`app/ai/`) | PI Agent SDK (`@mariozechner/pi-coding-agent`) |
| **Web Automation**| Playwright Python | Playwright TypeScript |
| **Data Parsing** | Pandas/BS4 | Cheerio / TS data tools |
| **Memory/State** | Motor (Async Mongo) | Mongoose / Custom PI SessionManager |

### Single Server Integration
Instead of running as an isolated CLI, the scraper will become a service within the `server/` module. 
- Triggered via API (`POST /api/admin/scraper/discover`) or Cron Jobs.
- Shares the same Mongoose connection and environmental configuration.

---

## 2. Component Migration Breakdown

### A. TypeScript & Playwright Integration
1. **Setup Playwright in TS**: Move `app/discovery/crawler.py` to `server/src/services/scraper/crawler.ts`.
2. **Network Sniffing**: Reimplement `network_sniffer.py` using Playwright TS's `page.on('request')` and `page.on('response')`.
3. **Data Detection**: Translate HTML table detection and file (PDF/XLS) detection algorithms into Node.js equivalents (e.g., using `cheerio` and `xlsx`).

### B. PI Agent SDK Integration (Replacing LangChain)
The core of the "Discovery" and "Mapping" phases will be rewritten as custom tools and prompt flows using `createAgentSession`.

1. **Tool Definitions (`defineTool`)**:
   - `navigateTool`: Tells Playwright to go to a URL.
   - `sniffNetworkTool`: Returns intercepted XHR/Fetch API endpoints and payloads.
   - `extractHtmlTool`: Returns a simplified DOM structure or detected tables.
   - `testExtractionTool`: Runs a dry-run extraction to validate CSS selectors or API schemas.

2. **Agent Workflows**:
   - **Discovery Workflow**:
     ```typescript
     const { session } = await createAgentSession({
        tools: [navigateTool, sniffNetworkTool, testExtractionTool],
        systemPromptOverride: () => "You are an AI scraper agent. Analyze the URL and find the best extraction method (API > HTML > File). Reply with a valid ExtractionConfig JSON.",
        sessionManager: MongoSessionManager.create(), // Custom Mongo wrapper
     });
     await session.prompt(`Discover how to scrape: ${targetUrl}`);
     ```
   - **Mapping Workflow**: Pass sample raw data to the agent and ask it to output a `SchemaMapping` mapping raw keys to the standardized `Price` schema.

### C. MongoDB as Memory & Storage
1. **PI Session Persistence (`SessionManager`)**:
   Implement a custom `SessionManager` that implements the PI Agent SDK interface but persists `session.jsonl` traces into MongoDB. This acts as the Agent's short-term and conversational memory.
   
2. **Long-Term Config Storage (Collections)**:
   - `sources`: Stores the discovered config (extraction method, API endpoints, schema mappings).
   - `scrape_runs`: Logs success/failure of cron runs.
   - `prices`: The normalized output data.

---

## 3. Step-by-Step Execution Plan

### Phase 1: Foundation & Dependencies
- Add `@mariozechner/pi-coding-agent`, `playwright`, `cheerio` to `server/package.json`.
- Define Mongoose schemas for `sources`, `scrape_runs`, and agent `memory_sessions`.
- Create `server/src/services/scraper/` directory.

### Phase 2: Core Web & Extraction Layers
- Port Playwright logic: Implement the crawler with headless browsing, pagination handling, and network sniffing in TS.
- Implement HTML/API scrapers: Create TS equivalents of `api_scraper.py` and `html_scraper.py`.

### Phase 3: Agentic Discovery with PI SDK
- Implement the Custom PI Tools (`navigateTool`, `extractHtmlTool`, `saveConfigTool`).
- Write the prompt templates for Discovery and Mapping.
- Build the `MongoSessionManager` so PI Agent state is durably saved in MongoDB instead of local files.
- Wire up the AI execution flow.

### Phase 4: Server Integration & API Routes
- Create Admin REST routes in `server/src/routes/admin.scraper.routes.ts`:
  - `POST /api/admin/scraper/discover`
  - `POST /api/admin/scraper/scrape`
- Hook up the `scrape_engine` to the existing node-cron scheduling (`server/src/jobs/cron.ts`).

### Phase 5: Testing & Decommissioning
- Run end-to-end tests for all supported modes (`discover`, `scrape`, `single_url`).
- Compare outputs with the old Python engine.
- Delete `scraper-engine/` Python code once stability is confirmed.

---

## 4. Example PI Agent Implementation (Pseudocode)

```typescript
import { createAgentSession, defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { CrawlerService } from "./crawler";

export async function runDiscoveryWorkflow(url: string) {
  const crawler = new CrawlerService();
  
  const sniffTool = defineTool({
    name: "get_network_activity",
    description: "Returns intercepted API calls from the page",
    parameters: Type.Object({}),
    execute: async () => ({
      content: [{ type: "text", text: JSON.stringify(await crawler.getNetworkLogs()) }],
    })
  });

  const { session } = await createAgentSession({
    customTools: [sniffTool],
    // Custom Mongo session manager to use DB as memory
    sessionManager: new MongoSessionManager(process.cwd(), dbConnection), 
    model: getModel("anthropic", "claude-3-5-sonnet"), // Or Gemini equivalent
  });

  await session.prompt(`
    Analyze ${url}. Navigate to it, check network logs, and determine how to extract price data.
    Output the final configuration.
  `);
  
  // Extract and save final config to DB
}
```
