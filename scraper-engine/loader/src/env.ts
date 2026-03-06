import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";

const __dirname = dirname(new URL(import.meta.url).pathname);

/**
 * Find the project root directory (containing the .env file)
 */
function findRootDir(): string {
  // Start from loader/src and go up to project root
  const candidates = [
    resolve(__dirname, "../../../.."), // loader/src -> loader -> scraper-engine -> project root
    resolve(__dirname, "../../.."),   // fallback
  ];
  
  for (const dir of candidates) {
    try {
      readFileSync(join(dir, ".env"), "utf-8");
      return dir;
    } catch {
      continue;
    }
  }
  
  // Fallback to standard location
  return resolve(__dirname, "../../../..");
}

/**
 * Load environment variables from root .env file
 */
export function loadEnv(): void {
  const rootDir = findRootDir();
  const envPath = join(rootDir, ".env");
  
  try {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      // Handle export prefix
      let lineContent = trimmed;
      if (lineContent.startsWith("export ")) {
        lineContent = lineContent.slice(7);
      }
      
      // Find first = sign
      const eqIndex = lineContent.indexOf("=");
      if (eqIndex === -1) continue;
      
      const key = lineContent.slice(0, eqIndex).trim();
      let value = lineContent.slice(eqIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already set
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
    
    console.log(`[ENV] Loaded environment from ${envPath}`);
  } catch (error) {
    console.warn(`[ENV] Warning: Could not load .env from ${envPath}`);
  }
}
