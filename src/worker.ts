import { buildDailyChallenge, getDateString, isValidDateString } from "./daily.js";
import type { DailyChallengeError } from "./types.js";

const DAILY_ROUTE = "/api/daily";

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(),
          ...nonCacheableApiHeaders(),
        },
      });
    }

    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== DAILY_ROUTE) {
      return jsonResponse(
        {
          ok: false,
          error: "Not found.",
          generatedAt: new Date().toISOString(),
        } satisfies DailyChallengeError,
        404,
      );
    }

    const date = url.searchParams.get("date")?.trim() || getDateString();
    if (!isValidDateString(date)) {
      return jsonResponse({
        ok: false,
        error: "Date must be a real calendar date in YYYY-MM-DD format.",
        generatedAt: new Date().toISOString(),
      } satisfies DailyChallengeError);
    }

    try {
      const challenge = await buildDailyChallenge(date, env.REBIGULATOR_BASE_URL);
      return jsonResponse(challenge, 200, cacheableApiHeaders());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        JSON.stringify({
          event: "daily_challenge_failed",
          date,
          error: message,
        }),
      );

      return jsonResponse({
        ok: false,
        date,
        error: message,
        generatedAt: new Date().toISOString(),
      } satisfies DailyChallengeError);
    }
  },
} satisfies ExportedHandler<Env>;

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = nonCacheableApiHeaders(),
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...headers,
    },
  });
}

function cacheableApiHeaders(now = new Date()): Record<string, string> {
  return {
    "cache-control": `public, max-age=${secondsUntilNextUtcDay(now)}`,
  };
}

export function secondsUntilNextUtcDay(now: Date): number {
  const nextUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((nextUtcDay - now.getTime()) / 1000));
}

function nonCacheableApiHeaders(): Record<string, string> {
  return {
    "cache-control": "no-store",
  };
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}
