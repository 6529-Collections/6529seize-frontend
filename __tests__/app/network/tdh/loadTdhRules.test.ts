/**
 * @jest-environment node
 */

import { loadTdhRules } from "@/app/network/tdh/loadTdhRules.server";

const RULES = {
  snapshot: {
    block_number: 26201364,
    block_timestamp: "2026-10-15T23:59:59Z",
    eligible_memes_count: 561,
  },
  boost: {
    base_multiplier: 1,
    final_rounding_decimals: 2,
    season_sets: [{ season: 1, bonus: 0.05 }],
    season_schedule: {
      bonus_per_season: 0.05,
      last_boosted_season: 20,
      max_bonus: 1,
    },
    full_collection: {
      first_set_bonus: 0.8,
      additional_set_initial_bonus: 0.05,
      additional_set_decay_ratio: 0.6529,
      additional_sets_limit_bonus: 0.144051,
    },
    season_one_partials: [],
    gradients: { bonus_per_token: 0.02, max_count: 5, max_bonus: 0.1 },
  },
};

describe("loadTdhRules", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("returns the rules the API answers", async () => {
    globalThis.fetch = jest.fn(
      async () => new Response(JSON.stringify(RULES), { status: 200 })
    ) as unknown as typeof fetch;
    const rules = await loadTdhRules();
    expect(rules?.snapshot.block_number).toBe(26_201_364);
    expect(String((globalThis.fetch as jest.Mock).mock.calls[0]?.[0])).toMatch(
      /\/api\/tdh\/rules$/
    );
  });

  it.each([
    ["an error status", async () => new Response("no", { status: 503 })],
    [
      "a malformed body",
      async () =>
        new Response(JSON.stringify({ snapshot: {} }), { status: 200 }),
    ],
    [
      "a network failure",
      async () => {
        throw new Error("offline");
      },
    ],
  ])(
    "returns null for %s, so the page fetches in the browser",
    async (_, impl) => {
      globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
      await expect(loadTdhRules()).resolves.toBeNull();
    }
  );
});
