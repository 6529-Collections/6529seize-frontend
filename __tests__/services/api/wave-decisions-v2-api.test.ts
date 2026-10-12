import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import type { ApiWaveDecisionsPageV2 } from "@/generated/models/ApiWaveDecisionsPageV2";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchWaveDecisionsV2 } from "@/services/api/wave-decisions-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = jest.mocked(commonApiFetch);

function createWinnerDrop(
  count: number,
  available: boolean | undefined
): ApiDropV2 {
  return {
    id: "winner-1",
    serial_no: 1,
    created_at: 1000,
    is_signed: false,
    hide_link_preview: false,
    parts_count: 1,
    author: {
      id: "author-1",
      primary_address: "0xauthor",
      level: 1,
      classification: ApiProfileClassification.Pseudonym,
      badges: { artist_of_main_stage_submissions: 0, artist_of_memes: 0 },
    },
    drop_type: ApiDropMainType.Submission,
    boosts: 0,
    submission_context: {
      status: ApiSubmissionDropStatus.Winner,
      has_metadata: false,
      voting: {
        is_open: false,
        total_votes_given: 11,
        current_calculated_vote: 2503,
        predicted_final_vote: 2503,
        voters_count: count,
        place: 1,
        ...(available === undefined
          ? {}
          : { voters_count_available: available }),
      },
    },
  };
}

describe("fetchWaveDecisionsV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { scenario: "missing voter history", count: 0, available: false },
    { scenario: "recorded zero voters", count: 0, available: true },
    { scenario: "recorded voters", count: 7, available: true },
    { scenario: "older server", count: 6, available: undefined },
  ])("preserves $scenario in winner cards", async ({ count, available }) => {
    const response: ApiWaveDecisionsPageV2 = {
      data: [
        {
          decision_time: 2000,
          winners: [
            { place: 1, awards: [], drop: createWinnerDrop(count, available) },
          ],
        },
      ],
      count: 1,
      page: 1,
      next: false,
    };
    commonApiFetchMock.mockResolvedValueOnce(response);

    const result = await fetchWaveDecisionsV2({
      waveId: "wave-1",
      params: { page: "1" },
    });
    const winner = result.data[0]?.winners[0]?.drop;

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/decisions",
      params: { page: "1" },
    });
    expect(winner).toMatchObject({
      drop_type: ApiDropType.Winner,
      rating: 2503,
      realtime_rating: 11,
      rating_prediction: 2503,
      raters_count: count,
    });
    if (available === undefined) {
      expect(winner).not.toHaveProperty("voters_count_available");
    } else {
      expect(winner).toHaveProperty("voters_count_available", available);
    }
    expect(result).toMatchObject({ count: 1, page: 1, next: false });
  });
});
