import { z } from "zod";
import { normaliseName } from "@/lib/utils";

const OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const suggestionSchema = z.object({
  description: z.string().trim().min(80).max(240),
  category: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(2).max(40)).min(2).max(8)
});

type ToolSuggestion = z.infer<typeof suggestionSchema>;

const preferredCasing = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["cli", "CLI"],
  ["css", "CSS"],
  ["devops", "DevOps"],
  ["dns", "DNS"],
  ["github", "GitHub"],
  ["git", "Git"],
  ["html", "HTML"],
  ["http", "HTTP"],
  ["https", "HTTPS"],
  ["ios", "iOS"],
  ["ip", "IP"],
  ["javascript", "JavaScript"],
  ["json", "JSON"],
  ["llm", "LLM"],
  ["macos", "macOS"],
  ["mcp", "MCP"],
  ["nas", "NAS"],
  ["npm", "npm"],
  ["oauth", "OAuth"],
  ["pdf", "PDF"],
  ["rdp", "RDP"],
  ["rss", "RSS"],
  ["sdk", "SDK"],
  ["ssh", "SSH"],
  ["sso", "SSO"],
  ["ui", "UI"],
  ["url", "URL"],
  ["vpn", "VPN"],
  ["vps", "VPS"]
]);

function toProperCase(value: string) {
  return normaliseName(value)
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      const preferredWord = preferredCasing.get(lower);
      if (preferredWord) return preferredWord;

      return word
        .split("-")
        .map((part) => {
          if (!part) return part;
          const partLower = part.toLowerCase();
          const preferredPart = preferredCasing.get(partLower);
          if (preferredPart) return preferredPart;
          return `${partLower.charAt(0).toUpperCase()}${partLower.slice(1)}`;
        })
        .join("-");
    })
    .join(" ");
}

function extractJsonObject(value: string) {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("The AI response was not valid JSON.");
  }

  return value.slice(firstBrace, lastBrace + 1);
}

function normaliseSuggestion(suggestion: ToolSuggestion): ToolSuggestion {
  return {
    description: suggestion.description.trim(),
    category: toProperCase(suggestion.category),
    tags: suggestion.tags.map(toProperCase).filter(Boolean)
  };
}

export async function suggestToolMetadata(url: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter is not configured. Add OPENROUTER_API_KEY to the environment.");
  }

  const parsedUrl = z.string().trim().url("Add a valid website or GitHub URL first.").parse(url);
  const hostname = new URL(parsedUrl).hostname.replace(/^www\./, "");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/aut0nate/The-Collection",
      "X-Title": "The Collection"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You suggest metadata for a public catalogue of recommended apps, command line tools, and resources. Use British English. Return only strict JSON with no markdown."
        },
        {
          role: "user",
          content: [
            `URL: ${parsedUrl}`,
            `Detected host: ${hostname}`,
            "",
            "Identify the service from the URL and return:",
            "- description: one useful sentence, 130 to 200 characters, maximum 240 characters",
            "- category: one short category name in proper title case",
            "- tags: 3 to 6 short tags in proper title case",
            "",
            "Description style example: A centralised remote connection manager for securely accessing and managing RDP, SSH, VPN, web, cloud, and database connections from a single interface.",
            "Avoid marketing language. Do not invent unsupported details. Prefer practical catalogue terms.",
            "",
            'JSON shape: {"description":"...","category":"...","tags":["..."]}'
          ].join("\n")
        }
      ],
      temperature: 0.2,
      max_tokens: 320
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenRouter request failed with status ${response.status}: ${message.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenRouter returned an empty response.");
  }

  const suggestion = suggestionSchema.parse(JSON.parse(extractJsonObject(content)));
  return normaliseSuggestion(suggestion);
}
