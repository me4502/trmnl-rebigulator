import { describe, expect, it } from "vitest";

import { getDailyEpisode, getDailyTimestampHashes, isValidDateString } from "./daily.js";

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

  it("only accepts real ISO calendar dates", () => {
    expect(isValidDateString("2026-07-24")).toBe(true);
    expect(isValidDateString("2026-02-31")).toBe(false);
    expect(isValidDateString("24-07-2026")).toBe(false);
  });
});
