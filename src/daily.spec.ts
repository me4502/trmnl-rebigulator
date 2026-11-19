import { describe, expect, it } from "vitest";

import {
  getDailyEpisode,
  getDailyImageIndex,
  getDailyTimestampHashes,
  isValidDateString,
} from "./daily.js";

describe("daily challenge selection", () => {
  it("matches the Rebigulator daily episode selection", () => {
    expect(getDailyEpisode("2023-03-01")).toEqual({
      label: "Three Gays of the Condo",
      value: "S14E17",
    });
    expect(getDailyEpisode("2025-07-03")).toEqual({
      label: "Bart Sells His Soul",
      value: "S07E04",
    });
  });

  it("generates six stable timestamp hashes", () => {
    expect(getDailyTimestampHashes("2023-03-01")).toEqual([
      0.5293715308721577, 0.702072634757979, 0.7895707892695374, 0.8930267786823741,
      0.332600548009528, 0.6933471038223586,
    ]);
  });

  it("shows each of six images in a separate sixth of the UTC day", () => {
    expect(getDailyImageIndex(new Date("2026-07-24T00:00:00.000Z"))).toBe(0);
    expect(getDailyImageIndex(new Date("2026-07-24T03:59:59.999Z"))).toBe(0);
    expect(getDailyImageIndex(new Date("2026-07-24T04:00:00.000Z"))).toBe(1);
    expect(getDailyImageIndex(new Date("2026-07-24T08:00:00.000Z"))).toBe(2);
    expect(getDailyImageIndex(new Date("2026-07-24T12:00:00.000Z"))).toBe(3);
    expect(getDailyImageIndex(new Date("2026-07-24T16:00:00.000Z"))).toBe(4);
    expect(getDailyImageIndex(new Date("2026-07-24T20:00:00.000Z"))).toBe(5);
  });

  it("only accepts real ISO calendar dates", () => {
    expect(isValidDateString("2026-07-24")).toBe(true);
    expect(isValidDateString("2026-02-31")).toBe(false);
    expect(isValidDateString("24-07-2026")).toBe(false);
  });
});
