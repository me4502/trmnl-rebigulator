import { beforeEach, describe, expect, it, vi } from "vitest";

import worker, { secondsUntilNextUtcDay } from "./worker.js";

const env: Env = {
  REBIGULATOR_BASE_URL: "https://rebigulator.org",
};

describe("daily API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createRebigulatorFetchMock());
  });

  it("returns the daily frame, quote, and answer", async () => {
    const response = await worker.fetch(
      incomingRequest("https://example.com/api/daily?date=2026-07-24"),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/^public, max-age=\d+$/);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      date: "2026-07-24",
      imageUrl: "https://frinkiac.com/img/S11E16/424242.jpg",
      quote: "First line. Second line.",
      answer: "S11E16 - Pygmoelian",
      playUrl: "https://rebigulator.org/daily/game",
    });
  });

  it("caches successful responses until the next UTC day", () => {
    expect(secondsUntilNextUtcDay(new Date("2026-07-24T12:00:00.000Z"))).toBe(43_200);
    expect(secondsUntilNextUtcDay(new Date("2026-07-24T23:59:59.500Z"))).toBe(1);
  });

  it("returns renderable JSON for invalid dates", async () => {
    const response = await worker.fetch(
      incomingRequest("https://example.com/api/daily?date=2026-02-31"),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Date must be a real calendar date in YYYY-MM-DD format.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns renderable JSON when Rebigulator is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("Unavailable", { status: 503 })),
    );

    const response = await worker.fetch(
      incomingRequest("https://example.com/api/daily?date=2026-07-24"),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      date: "2026-07-24",
      error: "Rebigulator returned HTTP 503.",
    });
  });
});

function incomingRequest(
  input: string,
  init?: RequestInit,
): Request<unknown, IncomingRequestCfProperties<unknown>> {
  return new Request(input, init) as Request<unknown, IncomingRequestCfProperties<unknown>>;
}

function cacheKeyUrl(request: RequestInfo | URL): string {
  if (typeof request === "string") {
    return request;
  }
  if (request instanceof URL) {
    return request.toString();
  }
  return request.url;
}

function createRebigulatorFetchMock() {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(cacheKeyUrl(input));
    if (url.pathname === "/api/get-episode-info") {
      return Response.json({
        Episode: {
          Id: 1,
          Key: "S11E16",
          Season: 11,
          EpisodeNumber: 16,
          Title: "Pygmoelian",
        },
        Subtitles: [
          {
            Id: 1,
            RepresentativeTimestamp: 123456,
            Episode: "S11E16",
            StartTimestamp: 122000,
            EndTimestamp: 124000,
            Content: "Selected line.",
            Language: "en",
          },
        ],
      });
    }

    if (url.pathname === "/api/get-screencap") {
      return Response.json({
        Episode: {
          Id: 1,
          Key: "S11E16",
          Season: 11,
          EpisodeNumber: 16,
          Title: "Pygmoelian",
        },
        Frame: {
          Id: 2,
          Episode: "S11E16",
          Timestamp: 424242,
        },
        Subtitles: [
          {
            Id: 1,
            RepresentativeTimestamp: 123456,
            Episode: "S11E16",
            StartTimestamp: 122000,
            EndTimestamp: 124000,
            Content: "First line.",
            Language: "en",
          },
          {
            Id: 2,
            RepresentativeTimestamp: 124456,
            Episode: "S11E16",
            StartTimestamp: 124000,
            EndTimestamp: 125000,
            Content: "Second line.",
            Language: "en",
          },
        ],
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
}
