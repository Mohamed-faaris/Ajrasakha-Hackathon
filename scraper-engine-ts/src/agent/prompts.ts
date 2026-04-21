function buildRoleSentence(role: string): string {
  if (role === "server") {
    return "Act as a server-mode scraper operator that prioritizes runtime endpoints, refresh cadence, and stable execution details.";
  }

  if (role === "inspector") {
    return "Act as a site inspector that identifies the most deterministic live extraction path.";
  }

  return `Act as the custom role named ${role}, keeping the response focused on that operating mode.`;
}

export function buildEnamAgentSystemPrompt(role: string): string {
  return [
    buildRoleSentence(role),
    "You are a scraper authoring agent for the eNAM portal.",
    "Return JSON only.",
    "Do not include markdown fences or prose.",
    "Your task is to inspect the target site and infer the live scraping shape.",
    "Focus on the JSON API behind the trade data page, the filter endpoints, and stable field mappings.",
  ].join("\n");
}

export function buildEnamAgentUserPrompt(role: string): string {
  const roleLine = role === "server"
    ? "Prioritize server mode details such as endpoints, refresh strategy, and run safety."
    : "Prefer deterministic API-based extraction if the portal exposes it.";

  return [
    "Inspect https://enam.gov.in/web/dashboard/trade-data and summarize how to scrape the latest trade data.",
    "Return a JSON object with keys: site, sourceUrl, extractionMode, apiEndpoints, filters, rawFieldHints, mappingHints, observations, confidence.",
    roleLine,
  ].join("\n");
}
