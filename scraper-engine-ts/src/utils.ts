import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getFileDir(metaUrl: string): string {
  return path.dirname(fileURLToPath(metaUrl));
}

function findAncestor(startDir: string, predicate: (dir: string) => boolean): string {
  let current = startDir;

  for (;;) {
    if (predicate(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error(`Unable to resolve ancestor from ${startDir}`);
}

export function getSrcRoot(metaUrl: string): string {
  return path.join(getPackageRoot(metaUrl), "src");
}

export function getPackageRoot(metaUrl: string): string {
  const startDir = getFileDir(metaUrl);
  return findAncestor(startDir, (dir) => path.basename(dir) === "scraper-engine-ts");
}

export function getRepoRoot(metaUrl: string): string {
  return path.resolve(getPackageRoot(metaUrl), "..");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toUpper(value: string | undefined | null): string {
  return (value ?? "").trim().toUpperCase();
}

export function parseDate(value: string | undefined | null): string {
  const text = (value ?? "").trim();
  if (!text) {
    return "";
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return text;
  }

  const slashMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return text;
}

export function parseNumber(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const text = (value ?? "").toString().replace(/,/g, "").trim();
  if (!text) {
    return 0;
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOptionalNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const text = value.toString().replace(/,/g, "").trim();
  if (!text) {
    return null;
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function parseHiddenInput(html: string, id: string): string {
  const pattern = new RegExp(`<input[^>]*id=["']${id}["'][^>]*value=["']([^"']*)["']`, "i");
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

export function buildOutputDir(baseDir: string, siteName: string, label: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(baseDir, siteName, `${label}-${stamp}`);
}
