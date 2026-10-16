import { screen } from "@testing-library/react";
import TDHCurrentRules, {
  seasonRanges,
} from "@/app/network/tdh/TDHCurrentRules";
import { commonApiFetch } from "@/services/api/common-api";
import { renderWithQueryClient } from "../../../utils/reactQuery";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

const rules = {
  snapshot: {
    block_number: 123,
    block_timestamp: "2026-09-09T00:00:00Z",
    eligible_memes_count: 1600,
  },
  boost: {
    base_multiplier: 1,
    final_rounding_decimals: 2,
    season_sets: [{ season: 15, bonus: 0.05 }],
    season_schedule: {
      bonus_per_season: 0.05,
      last_boosted_season: 20,
      max_bonus: 1,
    },
    full_collection: {
      first_set_bonus: 0.75,
      additional_set_initial_bonus: 0.05,
      additional_set_decay_ratio: 0.6529,
      additional_sets_limit_bonus: 0.144051,
    },
    season_one_partials: [
      { key: "genesis", token_ids: [1, 2, 3], bonus: 0.01 },
      { key: "nakamoto", token_ids: [4], bonus: 0.01 },
    ],
    gradients: { bonus_per_token: 0.02, max_count: 5, max_bonus: 0.1 },
  },
} as const;

function renderRules(locale: "en-US" | "fr-FR" = "en-US") {
  return renderWithQueryClient(<TDHCurrentRules locale={locale} />);
}

describe("TDHCurrentRules", () => {
  beforeEach(() => jest.clearAllMocks());

  it("groups consecutive seasons with the same bonus into one range", () => {
    expect(
      seasonRanges([
        { season: 3, bonus: 0.05 },
        { season: 1, bonus: 0.05 },
        { season: 2, bonus: 0.05 },
        { season: 5, bonus: 0.05 },
        { season: 6, bonus: 0.04 },
      ])
    ).toEqual([
      { from: 1, to: 3, bonus: 0.05 },
      { from: 5, to: 5, bonus: 0.05 },
      { from: 6, to: 6, bonus: 0.04 },
    ]);
  });

  it("renders current data and formats the current/future values by locale", async () => {
    fetchMock.mockResolvedValue(rules);
    renderRules("fr-FR");

    // The full set's card and the ladder both show it.
    expect((await screen.findAllByText(/1,75/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Season 15/i)).toBeInTheDocument();
    expect(screen.queryByText(/Season 16/i)).not.toBeInTheDocument();
    expect(screen.getByText(/2,24/)).toBeInTheDocument();
  });

  it("accepts an empty season list and derives the ceiling from the returned schedule", async () => {
    fetchMock.mockResolvedValue({
      ...rules,
      boost: {
        ...rules.boost,
        season_sets: [],
        season_schedule: {
          ...rules.boost.season_schedule,
          last_boosted_season: 22,
          max_bonus: 1.1,
        },
      },
    });
    renderRules();

    expect(await screen.findByText(/No seasons qualify/i)).toBeInTheDocument();
    expect(screen.getByText(/Seasons 1–22 each have/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.34/)).toBeInTheDocument();
  });

  it("rejects malformed rules without showing the old static 1.60 fallback", async () => {
    fetchMock.mockResolvedValue({ snapshot: {} });
    renderRules();

    expect(
      await screen.findByText(/temporarily unavailable/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/1\.60/)).not.toBeInTheDocument();
  });

  it("retries an API error and renders the returned rules", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(rules);
    const user = userEvent.setup();
    renderRules();

    expect(
      await screen.findByText(/temporarily unavailable/i)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reload rules/i }));
    expect(await screen.findByText(/Season 15/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["en-US", "1.75", "2.24"],
    ["en-GB", "1.75", "2.24"],
    ["fr-FR", "1,75", "2,24"],
    ["es-ES", "1,75", "2,24"],
    ["de-DE", "1,75", "2,24"],
  ] as const)(
    "keeps numeric formatting and fallback labels in %s",
    async (locale, fullMultiplier, ceiling) => {
      fetchMock.mockResolvedValue(rules);
      renderWithQueryClient(<TDHCurrentRules locale={locale} />);

      // The full set's card and the ladder's first rung.
      expect((await screen.findAllByText(`${fullMultiplier}×`)).length).toBe(2);
      expect(screen.getByText(`${ceiling}×`)).toBeInTheDocument();
      expect(
        screen.getByText("Four boost figures, and how they relate")
      ).toBeInTheDocument();
    }
  );
});
