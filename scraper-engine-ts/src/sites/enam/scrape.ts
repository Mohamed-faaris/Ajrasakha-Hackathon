import { ENAM_DEFAULT_FILTERS, ENAM_ENTRY_URL, ENAM_TRADE_DATA_URL, ENAM_TRADE_URL } from "./config.js";
import type { EnamRawRecord, EnamScrapeResult } from "./types.js";
import { parseHiddenInput } from "../../utils.js";

interface EnamScrapeOptions {
  date?: string;
  stateName?: string;
  apmcName?: string;
  commodityName?: string;
}

function makeHeaders(referer: string, cookie: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Referer: referer,
    Origin: "https://enam.gov.in",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

function cookieHeaderFromSetCookie(setCookieValue: string): string {
  if (!setCookieValue) {
    return "";
  }

  return setCookieValue
    .split(/,\s*(?=[^;]+?=)/)
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function buildTradeBody(date: string, options: EnamScrapeOptions): string {
  const payload = new URLSearchParams({
    language: ENAM_DEFAULT_FILTERS.language,
    stateName: options.stateName ?? ENAM_DEFAULT_FILTERS.stateName,
    apmcName: options.apmcName ?? ENAM_DEFAULT_FILTERS.apmcName,
    commodityName: options.commodityName ?? ENAM_DEFAULT_FILTERS.commodityName,
    fromDate: date,
    toDate: date,
  });
  return payload.toString();
}

async function fetchHtml(url: string): Promise<{ html: string; cookie: string }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ENAM page: HTTP ${response.status}`);
  }

  const html = await response.text();
  const cookie = cookieHeaderFromSetCookie(response.headers.get("set-cookie") ?? "");
  return { html, cookie };
}

export async function scrapeEnam(options: EnamScrapeOptions = {}): Promise<EnamScrapeResult> {
  const { html, cookie } = await fetchHtml(ENAM_TRADE_URL);
  const sourceDate = options.date || parseHiddenInput(html, "previous_date") || parseHiddenInput(html, "current_date") || new Date().toISOString().slice(0, 10);
  const body = buildTradeBody(sourceDate, options);

  const response = await fetch(ENAM_TRADE_DATA_URL, {
    method: "POST",
    headers: makeHeaders(ENAM_TRADE_URL, cookie),
    body,
  });

  if (!response.ok) {
    throw new Error(`ENAM trade data request failed: HTTP ${response.status}`);
  }

  const payload = await response.json() as { status?: number; data?: EnamRawRecord[]; message?: string };
  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(payload.message || "ENAM trade data response did not contain a valid data array");
  }

  return {
    site: "enam",
    sourceUrl: ENAM_ENTRY_URL,
    fetchedAt: new Date().toISOString(),
    sourceDate,
    records: payload.data,
    meta: {
      tradeUrl: ENAM_TRADE_URL,
      filterState: options.stateName ?? ENAM_DEFAULT_FILTERS.stateName,
      filterApmc: options.apmcName ?? ENAM_DEFAULT_FILTERS.apmcName,
      filterCommodity: options.commodityName ?? ENAM_DEFAULT_FILTERS.commodityName,
    },
  };
}
