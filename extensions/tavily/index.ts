import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi, AnyAgentTool } from "openclaw/plugin-sdk";

const TAVILY_SEARCH_ENDPOINT = "https://api.tavily.com/search";

const TavilySearchSchema = Type.Object({
  query: Type.String({ description: "Search query string." }),
  max_results: Type.Optional(
    Type.Number({
      description: "Maximum number of results to return (1-20, default: 5).",
      minimum: 1,
      maximum: 20,
    }),
  ),
  search_depth: Type.Optional(
    Type.Union(
      [
        Type.Literal("basic"),
        Type.Literal("advanced"),
        Type.Literal("fast"),
        Type.Literal("ultra-fast"),
      ],
      {
        description:
          'Search depth: "basic" (fast, 1 credit), "advanced" (detailed, 2 credits), "fast", "ultra-fast".',
      },
    ),
  ),
  topic: Type.Optional(
    Type.Union([Type.Literal("general"), Type.Literal("news"), Type.Literal("finance")], {
      description: 'Topic category: "general", "news", or "finance".',
    }),
  ),
  time_range: Type.Optional(
    Type.Union(
      [Type.Literal("day"), Type.Literal("week"), Type.Literal("month"), Type.Literal("year")],
      { description: "Filter results by recency: day, week, month, or year." },
    ),
  ),
  include_answer: Type.Optional(
    Type.Boolean({
      description: "Include an AI-synthesized answer to the query (default: false).",
    }),
  ),
});

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type TavilyResponse = {
  query?: string;
  answer?: string;
  results?: TavilyResult[];
  response_time?: string;
};

function resolveApiKey(pluginConfig?: Record<string, unknown>): string | undefined {
  const fromConfig =
    pluginConfig && typeof pluginConfig.apiKey === "string"
      ? pluginConfig.apiKey.trim()
      : undefined;
  if (fromConfig) {
    return fromConfig;
  }
  const fromEnv =
    typeof process.env.TAVILY_API_KEY === "string" ? process.env.TAVILY_API_KEY.trim() : "";
  return fromEnv || undefined;
}

function makeResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}

function createTavilySearchTool(pluginConfig?: Record<string, unknown>): AnyAgentTool {
  const defaultSearchDepth =
    pluginConfig && typeof pluginConfig.searchDepth === "string"
      ? pluginConfig.searchDepth
      : "basic";
  const defaultTopic =
    pluginConfig && typeof pluginConfig.topic === "string" ? pluginConfig.topic : "general";
  const defaultIncludeAnswer =
    pluginConfig && typeof pluginConfig.includeAnswer === "boolean"
      ? pluginConfig.includeAnswer
      : false;
  const defaultMaxResults =
    pluginConfig && typeof pluginConfig.maxResults === "number" ? pluginConfig.maxResults : 5;

  return {
    label: "Tavily Search",
    name: "tavily_search",
    description:
      "Search the web using Tavily — AI-optimized search that returns structured results with titles, URLs, and content snippets. Optionally includes an AI-synthesized answer.",
    parameters: TavilySearchSchema,
    execute: async (_toolCallId, rawArgs) => {
      const apiKey = resolveApiKey(pluginConfig);
      if (!apiKey) {
        return makeResult({
          error: "missing_tavily_api_key",
          message:
            "tavily_search needs a Tavily API key. Configure plugins.entries.tavily.apiKey or set TAVILY_API_KEY in the Gateway environment.",
        });
      }

      const args = rawArgs as Record<string, unknown>;
      const query = typeof args.query === "string" ? args.query.trim() : "";
      if (!query) {
        return makeResult({ error: "missing_query", message: "query is required." });
      }

      const maxResults =
        typeof args.max_results === "number" ? args.max_results : defaultMaxResults;
      const searchDepth =
        typeof args.search_depth === "string" ? args.search_depth : defaultSearchDepth;
      const topic = typeof args.topic === "string" ? args.topic : defaultTopic;
      const timeRange = typeof args.time_range === "string" ? args.time_range : undefined;
      const includeAnswer =
        typeof args.include_answer === "boolean" ? args.include_answer : defaultIncludeAnswer;

      const body: Record<string, unknown> = {
        query,
        max_results: Math.max(1, Math.min(20, Math.floor(maxResults))),
        search_depth: searchDepth,
        topic,
        include_answer: includeAnswer,
      };
      if (timeRange) {
        body.time_range = timeRange;
      }

      const start = Date.now();
      let response: Response;
      try {
        response = await fetch(TAVILY_SEARCH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        return makeResult({
          error: "network_error",
          message: `Tavily request failed: ${String(err)}`,
        });
      }

      if (!response.ok) {
        let detail = response.statusText;
        try {
          const text = await response.text();
          if (text) {
            detail = text.slice(0, 512);
          }
        } catch {
          // ignore
        }
        return makeResult({
          error: "tavily_api_error",
          message: `Tavily API error (${response.status}): ${detail}`,
        });
      }

      let data: TavilyResponse;
      try {
        data = (await response.json()) as TavilyResponse;
      } catch (err) {
        return makeResult({
          error: "invalid_response",
          message: `Tavily returned invalid JSON: ${String(err)}`,
        });
      }

      const results = (data.results ?? []).map((entry) => ({
        title: entry.title ?? "",
        url: entry.url ?? "",
        content: entry.content ?? "",
        score: entry.score,
      }));

      const payload: Record<string, unknown> = {
        query,
        provider: "tavily",
        count: results.length,
        tookMs: Date.now() - start,
        results,
      };
      if (includeAnswer && data.answer) {
        payload.answer = data.answer;
      }

      return makeResult(payload);
    },
  };
}

const plugin = {
  id: "tavily",
  name: "Tavily Search",
  description: "Web search via Tavily API — AI-optimized search with structured results.",
  register(api: OpenClawPluginApi) {
    api.registerTool(
      (ctx: { sandboxed?: boolean }): AnyAgentTool | null => {
        if (ctx.sandboxed) {
          return null;
        }
        return createTavilySearchTool(api.pluginConfig);
      },
      { name: "tavily_search" },
    );
  },
};

export default plugin;
