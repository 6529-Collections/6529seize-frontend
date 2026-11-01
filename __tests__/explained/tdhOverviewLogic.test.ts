import {
  exampleSummary,
  firstCount,
  includedIn,
  shareOfWindow,
  summarizeProfile,
} from "@/app/network/tdh/overview/explain";
import { showNetworkDistribution } from "@/app/network/tdh/overview/flags";
import { missingResultDays } from "@/app/network/tdh/overview/HowWeKnowLadder";
import { machineCards } from "@/app/network/tdh/overview/machineCards";
import type { FactBook } from "@/lib/explained/facts";
import { movedAnchor } from "@/app/network/tdh/overview/LegacyAnchors";
import {
  loadNetworkDistribution,
  rankGroups,
} from "@/app/network/tdh/overview/networkDistribution.server";
import type { TdhProfile } from "@/app/network/tdh/tdh-profile.helpers";
import { localeFromAcceptLanguage } from "@/lib/explained/locale.server";

jest.mock("next/headers", () => ({ headers: jest.fn() }));

function token(
  id: string,
  balance: number,
  days: number[],
  rate: number,
  tdh: number
) {
  return {
    id,
    balance,
    tdh,
    tdh__raw: days.reduce((sum, value) => sum + value, 0),
    hodl_rate: rate,
    days_held_per_edition: days,
  };
}

const PROFILE: TdhProfile = {
  block: 26_215_721,
  date: "2026-10-18T00:00:00.000Z",
  wallets: ["0x0000000000000000000000000000000000000001"],
  consolidation_display: "an example",
  tdh: 6_480,
  tdh__raw: 1_634,
  boost: 1.02,
  boosted_tdh: 6_610,
  boosted_tdh_rate: 26,
  memes: [
    token("2", 1, [1592], 3.94, 6_272),
    token("560", 2, [5, 3], 12.71, 102),
    token("8", 0, [], 1, 0),
  ],
  gradients: [token("12", 1, [3], 39.02, 117)],
  nextgen: [],
  boost_breakdown: {},
};

describe("Explain my TDH: the arithmetic", () => {
  it("lists a record's cards, the largest base first, with ages as one number or a range", () => {
    const summary = summarizeProfile(PROFILE, 8, (collection, id) =>
      collection === "memes" && id === "2" ? 1000 : null
    );
    expect(summary.rows.map((row) => `${row.collection}:${row.id}`)).toEqual([
      "memes:2",
      "gradients:12",
      "memes:560",
    ]);
    expect(summary.rows[0]).toMatchObject({
      edition: 1000,
      copies: 1,
      days: [1592],
      rateCents: 394,
      base: 6_272,
    });
    expect(summary.rows[2]?.days).toEqual([3, 5]);
    expect(summary).toMatchObject({
      base: 6_480,
      boostCents: 102,
      total: 6_610,
      more: { count: 0, base: 0 },
    });
  });

  it("folds the rest of a long record into one line", () => {
    const summary = summarizeProfile(PROFILE, 1, () => null);
    expect(summary.rows).toHaveLength(1);
    expect(summary.more).toEqual({ count: 2, base: 219 });
  });

  it("computes the example record with the engine: 6,272 + 127 = 6,399", () => {
    const summary = exampleSummary(
      [
        { id: "2", edition: 1000, copies: 1, days: 1592, rateCents: 394 },
        { id: "560", edition: 310, copies: 2, days: 5, rateCents: 1271 },
      ],
      100
    );
    expect(summary.rows.map((row) => row.base)).toEqual([6_272, 127]);
    expect(summary.base).toBe(6_399);
    expect(summary.total).toBe(6_399);
  });

  it("says a record was included only for the compared block, with every identity equal", () => {
    expect(includedIn(PROFILE, { cutoff: 26_215_721, allEqual: true })).toBe(
      true
    );
    expect(includedIn(PROFILE, { cutoff: 26_215_721, allEqual: false })).toBe(
      false
    );
    expect(includedIn(PROFILE, { cutoff: 26_208_520, allEqual: true })).toBe(
      false
    );
    expect(includedIn(PROFILE, null)).toBe(false);
  });

  it("counts a copy bought at 19:05 on Oct 17 from the result of Oct 19 (P26 §4.3)", () => {
    expect(firstCount("2026-10-17T19:05:00Z")).toEqual({
      gapDate: "2026-10-18",
      gapMinutes: 295,
      firstDate: "2026-10-19",
    });
    expect(firstCount("2026-10-17T23:59:00Z")).toEqual({
      gapDate: "2026-10-18",
      gapMinutes: 1,
      firstDate: "2026-10-19",
    });
    expect(firstCount("2026-10-18T00:01:00Z").firstDate).toBe("2026-10-20");
  });

  it("places a moment on the timeline's window", () => {
    expect(shareOfWindow("2026-10-17T00:00:00Z", "2026-10-16", 4)).toBe(0.25);
    expect(shareOfWindow("2026-10-30T00:00:00Z", "2026-10-16", 4)).toBe(1);
    expect(shareOfWindow("2026-10-01T00:00:00Z", "2026-10-16", 4)).toBe(0);
  });
});

describe("the machine's fourth card", () => {
  // memes.editions rows: [id, season, minted, effective edition].
  function book(rows: number[][]): FactBook {
    const facts: Record<string, unknown> = {
      "memes.editions": rows,
      "rules.editionThreshold": 300,
    };
    return {
      maybe: (id: string) =>
        id in facts ? ({ value: facts[id] } as never) : null,
    } as unknown as FactBook;
  }

  it("is the newest card while it mints below the threshold, counted at its claim floor", () => {
    const cards = machineCards(
      book([
        [561, 17, 310, 310],
        [562, 17, 152, 310],
      ])
    );
    expect(cards.map((card) => card.id)).toEqual([2, 4, 3, 562]);
    expect(cards[3]).toEqual({ id: 562, title: null, art: null });
  });

  it("falls back to #562, with its art, when the facts layer cannot say what the newest card counts as", () => {
    // #568 minted 157 with no recorded claim limit: its edition is not known.
    const cards = machineCards(
      book([
        [562, 17, 310, 310],
        [568, 17, 157, 157],
      ])
    );
    expect(cards[3]).toMatchObject({ id: 562, title: "Play the Long Game" });
    expect(cards[3]?.art).toContain("/562.WEBP");
  });

  it("falls back to #562 once the newest card has finished minting", () => {
    const cards = machineCards(book([[567, 17, 310, 310]]));
    expect(cards[3]).toMatchObject({ id: 562, title: "Play the Long Game" });
  });
});

describe("days without a result", () => {
  it("names the days inside the comparison's range that have no result yet", () => {
    const days = [20740, 20741, 20742, 20744, 20747].map((cycle) => ({
      cycle,
    }));
    expect(missingResultDays(days, "en-US")).toEqual([
      "Oct 17",
      "Oct 19",
      "Oct 20",
    ]);
    expect(missingResultDays([{ cycle: 20740 }], "en-US")).toEqual([]);
    expect(missingResultDays([], "en-US")).toEqual([]);
  });
});

describe("the network's distribution", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sums identities by rank: the top ten, the next ninety, the next nine hundred, the rest", () => {
    const values = Array.from({ length: 1205 }, (_, index) => 1205 - index);
    const groups = rankGroups(values);
    expect(groups.map((group) => [group.key, group.count])).toEqual([
      ["top", 10],
      ["next", 90],
      ["next2", 900],
      ["rest", 205],
    ]);
    const total = values.reduce((sum, value) => sum + value, 0);
    expect(groups.reduce((sum, group) => sum + group.tdh, 0)).toBe(total);
    expect(rankGroups([5, 3])).toEqual([{ key: "top", count: 2, tdh: 8 }]);
  });

  function page(values: number[], next: string | null) {
    return {
      ok: true,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          next,
          data: values.map((boosted_tdh) => ({ boosted_tdh })),
        }),
    };
  }

  it("reads every page until the TDH reaches zero, and keeps only the numbers", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(page([900, 50], "page-2"))
      .mockResolvedValueOnce(page([30, 0], "page-3"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const data = await loadNetworkDistribution();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "tdh/consolidated_metrics?page_size=1000&page=1&sort=boosted_tdh&sort_direction=DESC"
    );
    expect(data).toEqual({
      total: 980,
      identities: 3,
      groups: [{ key: "top", count: 3, tdh: 980 }],
      source: "6529.io API tdh/consolidated_metrics",
      readAt: null,
    });
  });

  it("draws the shipped snapshot, with its read date, when the API does not answer", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const failed = await loadNetworkDistribution();
    expect(failed).toMatchObject({ fromSnapshot: true });
    expect(failed?.readAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(failed?.groups.map((group) => group.key)).toEqual([
      "top",
      "next",
      "next2",
      "rest",
    ]);
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    await expect(loadNetworkDistribution()).resolves.toMatchObject({
      fromSnapshot: true,
    });
  });

  it("says when 6529.io answered, from the API's own Date header", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ...page([7, 0], null),
      headers: { get: () => "Sat, 31 Oct 2026 09:12:00 GMT" },
    }) as unknown as typeof fetch;
    await expect(loadNetworkDistribution()).resolves.toMatchObject({
      total: 7,
      readAt: "2026-10-31T09:12:00Z",
    });
  });

  it("is on by default (the owner's decision), and a review link can switch it off", () => {
    expect(showNetworkDistribution(undefined)).toBe(true);
    expect(showNetworkDistribution("on")).toBe(true);
    expect(showNetworkDistribution("off")).toBe(false);
    expect(showNetworkDistribution("yes")).toBe(true);
  });
});

describe("old links and the reader's language", () => {
  it("sends anchors that moved to their new pages and keeps the ones that stayed", () => {
    expect(movedAnchor("#tdh-changes")).toBe("/network/tdh/consolidation#why");
    expect(movedAnchor("#tdh-1-4")).toBe("/network/tdh/how-it-works#part-c");
    expect(movedAnchor("#tdh-exact")).toBe("/network/tdh/how-it-works");
    expect(movedAnchor("#glossary")).toBe("/network/tdh/glossary");
    expect(movedAnchor("#glossary-boost")).toBe("/network/tdh/glossary#boost");
    for (const stays of [
      "#tdh-minute",
      "#tdh-example",
      "#tdh-reference",
      "#tdh-profile",
      "#explain",
      "#tdh-verified",
      "#tdh-deeper",
      "#tdh-explore",
      "",
    ]) {
      expect(movedAnchor(stays)).toBeNull();
    }
  });

  it("reads the reader's language exactly or by language, else none", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9")).toBe("de-DE");
    expect(localeFromAcceptLanguage("fr")).toBe("fr-FR");
    expect(localeFromAcceptLanguage("pt-BR, es;q=0.5")).toBe("es-ES");
    expect(localeFromAcceptLanguage("en-GB")).toBe("en-GB");
    expect(localeFromAcceptLanguage("ja-JP, *")).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
  });
});
