# scraper-engine-ts

Standalone TypeScript scraper workspace for site-by-site ingestion.

Current first site:

- `enam`

Each site is split into three separate scripts:

- `scrape.ts` for raw extraction
- `map.ts` for raw field mapping
- `normalize.ts` for canonical output

## Commands

```bash
pnpm --dir scraper-engine-ts run latest:enam
pnpm --dir scraper-engine-ts run scrape:enam
pnpm --dir scraper-engine-ts run map:enam
pnpm --dir scraper-engine-ts run normalize:enam
pnpm --dir scraper-engine-ts run verify:enam
pnpm --dir scraper-engine-ts run inspect:enam
```

## Manual fixture

The `verify:enam` command uses the checked-in Python fixture at:

`tmp/seed-scraper/data-tmps/crops/enam.json`
