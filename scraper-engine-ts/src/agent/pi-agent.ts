import { AuthStorage, createAgentSession, DefaultResourceLoader, defineTool, getAgentDir, ModelRegistry, SessionManager } from "@mariozechner/pi-coding-agent";
import { Type } from "@mariozechner/pi-ai";
import { buildEnamAgentSystemPrompt, buildEnamAgentUserPrompt } from "./prompts.js";
import type { InspectRole } from "../types.js";

function trimJsonResponse(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJsonObject(text: string): unknown {
  const cleaned = trimJsonResponse(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("PI Agent did not return a JSON object");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export interface InspectEnamOptions {
  role?: InspectRole;
}

export async function inspectEnamWithAgent(options: InspectEnamOptions = {}): Promise<unknown> {
  const role = options.role ?? "inspector";
  const cwd = process.cwd();
  const authStorage = AuthStorage.create();
  const modelRegistry = ModelRegistry.create(authStorage);
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir: getAgentDir(),
    systemPromptOverride: () => buildEnamAgentSystemPrompt(role),
    appendSystemPromptOverride: () => [],
  });

  await loader.reload();

  const { session } = await createAgentSession({
    cwd,
    agentDir: getAgentDir(),
    authStorage,
    modelRegistry,
    sessionManager: SessionManager.inMemory(cwd),
    resourceLoader: loader,
    customTools: [
      defineTool({
        name: "web_fetch",
        label: "Web Fetch",
        description: "Fetch a URL and return text for site inspection.",
        promptSnippet: "Fetch a URL",
        promptGuidelines: ["Use this tool to inspect ENAM pages and endpoints."],
        parameters: Type.Object({
          url: Type.String({ description: "URL to fetch" }),
        }),
        execute: async (_toolCallId: string, params: { url: string }, signal?: AbortSignal) => {
          const response = await fetch(params.url, {
            signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
          });

          const text = await response.text();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    url: params.url,
                    status: response.status,
                    contentType: response.headers.get("content-type"),
                    text: text.slice(0, 12000),
                  },
                  null,
                  2
                ),
              },
            ],
            details: {
              status: response.status,
              contentType: response.headers.get("content-type") ?? undefined,
            },
          };
        },
      }),
    ],
  });

  let output = "";
  const unsubscribe = session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      output += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(buildEnamAgentUserPrompt(role));
  } finally {
    unsubscribe();
    session.dispose();
  }

  return parseJsonObject(output);
}
