import { WaveScoreTransparencyPage } from "@/components/waves/discovery/WaveScoreTransparencyPage";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { fetchWaveById, searchWavesByName } from "@/services/api/waves-v2-api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useSetTitle: () => jest.fn(),
}));

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveById: jest.fn(),
  searchWavesByName: jest.fn(),
}));

const fetchWaveByIdMock = fetchWaveById as jest.MockedFunction<
  typeof fetchWaveById
>;
const searchWavesByNameMock = searchWavesByName as jest.MockedFunction<
  typeof searchWavesByName
>;

const WAVE_ID = "12345678-1234-1234-1234-123456789abc";

const formula = {
  max_level_raw_for_score: 25000000,
  max_wave_rep_for_score: 200000000,
  trusted_level_raw: 1000,
  low_trust_level_raw: 25,
  recent_activity_window_ms: 604800000,
  recent_activity_half_life_ms: 172800000,
  participation_saturation_scale: 600,
  trusted_diversity_saturation_scale: 8,
  trusted_subscription_saturation_scale: 30,
  recent_activity_saturation_scale: 250,
  trusted_visible_min_visibility_score: 55,
  exploration_neutral_min_visibility_score: 25,
  demoted_min_visibility_score: 10,
  quality_component_weights: {
    creator_score: 0.2,
    level_weighted_participation_score: 0.2,
    trusted_diversity_score: 0.15,
    trusted_subscription_score: 0.1,
    wave_rep_component_score: 0.35,
  },
  hotness_component_weights: {
    recent_trusted_activity_score: 0.65,
    quality_score: 0.35,
  },
  visibility_component_weights: {
    quality_score: 0.65,
    gated_hotness_score: 0.35,
  },
};

const wave = {
  id: WAVE_ID,
  name: "Test Wave",
  author: {
    handle: "tester",
  },
  wave: {
    type: ApiWaveType.Chat,
  },
  chat: {
    scope: {
      group: {
        is_direct_message: false,
      },
    },
  },
  wave_rep: {
    total_rep: 1256529,
    positive_rep: 1300000,
    negative_rep: -43471,
    contributor_count: 9,
  },
  wave_score: {
    score_version: "wave-score-v1",
    visibility_score: 83,
    quality_score: 78,
    hotness_score: 92,
    rep_sort_score: 87,
    visibility_tier: "trusted_visible",
    calculated_at: Date.UTC(2026, 5, 17, 12, 0, 0),
    formula,
    quality_gate: {
      threshold: 25,
      multiplier: 1,
      gated_hotness_score: 92,
    },
    components: {
      creator_score: 90,
      level_weighted_participation_score: 80,
      trusted_diversity_score: 75,
      trusted_subscription_score: 60,
      wave_rep_component_score: 87,
      recent_trusted_activity_score: 94,
    },
    penalties: {
      safety_multiplier: 1,
      single_actor_penalty: 0,
      low_trust_flood_penalty: 0,
      cross_post_pressure: 3,
      cross_post_penalty: 1,
      negative_rep_penalty: 2,
    },
  },
} as any;

describe("WaveScoreTransparencyPage", () => {
  const scrollIntoViewMock = jest.fn();
  const writeTextMock = jest.fn();
  const clipboardMock = {
    writeText: writeTextMock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchWaveByIdMock.mockResolvedValue(wave);
    searchWavesByNameMock.mockResolvedValue([]);
    writeTextMock.mockResolvedValue(undefined);
    Object.defineProperty(globalThis.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });
  });

  it("returns to the source wave and exposes share actions for the calculated analysis", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: clipboardMock,
    });
    render(<WaveScoreTransparencyPage initialReturnTo={`/waves/${WAVE_ID}`} />);

    expect(screen.getByRole("link", { name: "Back to wave" })).toHaveAttribute(
      "href",
      `/waves/${WAVE_ID}`
    );

    await user.type(screen.getByLabelText("Wave name or URL"), WAVE_ID);
    await user.click(screen.getByRole("button", { name: "Score" }));

    const resultHeading = await screen.findByRole("heading", {
      name: "Test Wave",
    });
    expect(fetchWaveByIdMock).toHaveBeenCalledWith({ waveId: WAVE_ID });
    await waitFor(() => expect(scrollIntoViewMock).toHaveBeenCalled());

    const summaryHeading = screen.getByRole("heading", {
      name: "What the score is trying to do",
    });
    expect(
      resultHeading.compareDocumentPosition(summaryHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy wave score analysis as Markdown",
      })
    );

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining("# Wave score analysis: Test Wave")
      )
    );
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("- Wave REP: 1,256,529 raw -> 87 component")
    );
    expect(screen.getByText("Markdown analysis copied.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Download wave score analysis screenshot",
      })
    ).toBeInTheDocument();
  });
});
