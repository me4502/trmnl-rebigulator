import episodesJson from "./episodes.json";
import type {
  DailyChallenge,
  EpisodeInfoResponse,
  EpisodeListItem,
  ScreencapResponse,
} from "./types.js";

const ROUND_COUNT = 6;
const S17_LIMIT_CUTOFF = "2026-06-08";
const MAX_UPSTREAM_BODY_BYTES = 2 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;

const episodes = episodesJson as EpisodeListItem[];

export function getDateString(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && getDateString(date) === value;
}

export function getDailyEpisode(dateString: string): EpisodeListItem {
  const availableEpisodes =
    dateString <= S17_LIMIT_CUTOFF
      ? episodes.filter((episode) => {
          if (episode.value === "Movie") {
            return true;
          }

          const season = Number.parseInt(episode.value.split("E")[0].slice(1), 10);
          return season <= 17;
        })
      : episodes;

  let hash = 0;
  for (let index = 0; index < dateString.length; index++) {
    const character = dateString.codePointAt(index) ?? 0;
    hash = (hash << 5) - hash + character;
    hash &= hash;
  }

  return availableEpisodes[Math.abs(hash) % availableEpisodes.length];
}

export function getDailyTimestampHashes(dateString: string): number[] {
  const timestampHashes: number[] = [];

  for (let round = 0; round < ROUND_COUNT; round++) {
    const seedString = `${dateString}-round${round * 12347}-salt${round * 98765 + 54321}`;
    let hash = 5381;

    for (let index = 0; index < seedString.length; index++) {
      const character = seedString.codePointAt(index) ?? 0;
      hash = (hash << 5) + hash + character;
      hash >>>= 0;
    }

    const mixingConstant = [0x85ebca6b, 0xc2b2ae35, 0xcc9e2d51, 0x1b873593, 0xe6546b64, 0x9e3779b9][
      round
    ];
    hash ^= hash >>> 16;
    hash *= mixingConstant;
    hash ^= hash >>> 13;
    hash *= 0xc2b2ae35;
    hash ^= hash >>> 16;
    hash >>>= 0;
    hash ^= (round * 2654435761) >>> 0;
    hash >>>= 0;

    timestampHashes.push(hash / 4294967295);
  }

  return timestampHashes;
}

export async function buildDailyChallenge(
  dateString: string,
  baseUrl: string,
): Promise<DailyChallenge> {
  const dailyEpisode = getDailyEpisode(dateString);
  const episodeInfoUrl = new URL("/api/get-episode-info", baseUrl);
  episodeInfoUrl.searchParams.set("episode", dailyEpisode.value);

  const episodeInfo = await fetchJson<EpisodeInfoResponse>(episodeInfoUrl, isEpisodeInfoResponse);
  if (episodeInfo.Subtitles.length === 0) {
    throw new Error("The daily episode did not include any subtitles.");
  }

  const timestampHash = getDailyTimestampHashes(dateString)[0];
  const subtitleIndex = Math.min(
    Math.floor(timestampHash * episodeInfo.Subtitles.length),
    episodeInfo.Subtitles.length - 1,
  );
  const selectedSubtitle = episodeInfo.Subtitles[subtitleIndex];

  const screencapUrl = new URL("/api/get-screencap", baseUrl);
  screencapUrl.searchParams.set("episode", dailyEpisode.value);
  screencapUrl.searchParams.set("timestamp", String(selectedSubtitle.RepresentativeTimestamp));

  const screencap = await fetchJson<ScreencapResponse>(screencapUrl, isScreencapResponse);
  const quote = screencap.Subtitles.map((subtitle) => subtitle.Content.trim())
    .filter(Boolean)
    .join(" ");

  return {
    ok: true,
    date: dateString,
    imageUrl: `https://frinkiac.com/img/${encodeURIComponent(screencap.Episode.Key)}/${screencap.Frame.Timestamp}.jpg`,
    quote: quote || selectedSubtitle.Content,
    answer: `${screencap.Episode.Key} - ${screencap.Episode.Title}`,
    playUrl: "https://rebigulator.org/daily/game",
    generatedAt: new Date().toISOString(),
  };
}

async function fetchJson<T>(
  url: URL,
  isExpectedResponse: (value: unknown) => value is T,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Rebigulator returned HTTP ${response.status}.`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPSTREAM_BODY_BYTES) {
    throw new Error("Rebigulator returned an unexpectedly large response.");
  }

  const data: unknown = await response.json();
  if (!isExpectedResponse(data)) {
    throw new Error("Rebigulator returned an unexpected response.");
  }

  return data;
}

function isEpisodeInfoResponse(value: unknown): value is EpisodeInfoResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isEpisode(value.Episode) && Array.isArray(value.Subtitles) && value.Subtitles.every(isSubtitle)
  );
}

function isScreencapResponse(value: unknown): value is ScreencapResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isEpisode(value.Episode) &&
    isRecord(value.Frame) &&
    typeof value.Frame.Timestamp === "number" &&
    Array.isArray(value.Subtitles) &&
    value.Subtitles.every(isSubtitle)
  );
}

function isEpisode(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.Key === "string" &&
    typeof value.Title === "string" &&
    typeof value.Season === "number" &&
    typeof value.EpisodeNumber === "number"
  );
}

function isSubtitle(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.Content === "string" &&
    typeof value.RepresentativeTimestamp === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
