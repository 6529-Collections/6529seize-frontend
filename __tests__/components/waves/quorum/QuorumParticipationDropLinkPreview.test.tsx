import { waitFor } from "@testing-library/react";

import QuorumParticipationDropLinkPreview from "@/components/waves/quorum/QuorumParticipationDropLinkPreview";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { renderWithQueryClient } from "../../../utils/reactQuery";

const mockQuorumParticipationDrop = jest.fn(() => (
  <div data-testid="quorum-drop" />
));
const mockWaveDropQuote = jest.fn(() => <div data-testid="wave-drop-quote" />);
const mockLinkHandlerFrame = jest.fn(({ children }: any) => (
  <div data-testid="link-frame">{children}</div>
));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/services/api/drop-api", () => {
  const { QueryKey } = jest.requireActual(
    "@/components/react-query-wrapper/ReactQueryWrapper"
  );
  return {
    DROP_DETAIL_STALE_TIME_MS: 60 * 1000,
    fetchDropByIdBatched: jest.fn(),
    getDropQueryKey: (dropId: string | null | undefined) => [
      QueryKey.DROP,
      { drop_id: dropId ?? null },
    ],
  };
});

jest.mock("@/components/waves/quorum/QuorumParticipationDrop", () => ({
  __esModule: true,
  default: (props: any) => mockQuorumParticipationDrop(props),
}));

jest.mock("@/components/waves/drops/WaveDropQuote", () => ({
  __esModule: true,
  default: (props: any) => mockWaveDropQuote(props),
}));

jest.mock("@/components/waves/LinkHandlerFrame", () => ({
  __esModule: true,
  default: (props: any) => mockLinkHandlerFrame(props),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const fetchDropByIdBatchedMock = fetchDropByIdBatched as jest.MockedFunction<
  typeof fetchDropByIdBatched
>;

const buildDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    serial_no: 7,
    drop_type: ApiDropType.Participatory,
    wave: { id: "quorum-wave", name: "Quorum" },
    reply_to: null,
    author: { handle: "alice" },
    title: "Proposal",
    parts: [{ part_id: 1, content: "Proposal body", media: [] }],
    metadata: [],
    created_at: 1000,
    rank: null,
    ...overrides,
  }) as any;

const buildWaveOverview = () =>
  ({
    id: "quorum-wave",
    name: "Quorum",
    pfp: null,
    last_drop_time: 1000,
    created_at: 1000,
    subscribers_count: 1,
    has_competition: true,
    is_dm_wave: false,
    description_drop: { contents: null, media: [] },
    total_drops_count: 1,
    is_private: false,
    context_profile_context: {
      subscribed: false,
      pinned: false,
      can_chat: true,
      unread_drops: 0,
      muted: false,
    },
  }) as any;

const buildDropV2 = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    serial_no: 7,
    created_at: 1000,
    is_signed: false,
    hide_link_preview: false,
    title: "Proposal",
    content: "Proposal body",
    media: [],
    attachments: [],
    parts_count: 1,
    author: {
      id: "profile-1",
      handle: "alice",
      pfp: null,
      level: 0,
      classification: ApiProfileClassification.Pseudonym,
      primary_address: "0xabc",
    },
    drop_type: ApiDropMainType.Submission,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    nft_links: [],
    reactions: [],
    boosts: 0,
    submission_context: {
      status: ApiSubmissionDropStatus.Active,
      has_metadata: false,
      voting: {
        is_open: true,
        total_votes_given: 0,
        current_calculated_vote: 0,
        predicted_final_vote: 0,
        voters_count: 0,
        place: 0,
        context_profile_context: {
          can_vote: true,
          min: 0,
          max: 0,
          current: 0,
        },
      },
    },
    context_profile_context: {
      boosted: false,
      bookmarked: false,
      subscribed: false,
    },
    ...overrides,
  }) as any;

describe("QuorumParticipationDropLinkPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads a drop id and renders the quorum participation design", async () => {
    const drop = buildDrop();
    fetchDropByIdBatchedMock.mockResolvedValue(drop);

    renderWithQueryClient(
      <QuorumParticipationDropLinkPreview
        href="https://site.com/waves/quorum-wave?drop=drop-1"
        waveId="quorum-wave"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockQuorumParticipationDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ id: "drop-1" }),
          showInteractions: false,
          showReplyAndQuote: false,
        })
      );
    });
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("drop-1");
  });

  it("loads a serial number and renders the quorum participation design", async () => {
    const drop = buildDropV2();
    commonApiFetchMock.mockResolvedValue({
      drops: [drop],
      wave: buildWaveOverview(),
    });

    renderWithQueryClient(
      <QuorumParticipationDropLinkPreview
        href="https://site.com/waves/quorum-wave?serialNo=7"
        waveId="quorum-wave"
        serialNo="7"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockQuorumParticipationDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ id: "drop-1" }),
          showInteractions: false,
        })
      );
    });
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/quorum-wave/drops",
      params: {
        limit: "1",
        serial_no_limit: "7",
        search_strategy: "FIND_BOTH",
      },
    });
  });

  it("falls back to the normal quote preview for non-participatory drops", async () => {
    const drop = buildDrop({ drop_type: ApiDropType.Chat });
    fetchDropByIdBatchedMock.mockResolvedValue(drop);

    renderWithQueryClient(
      <QuorumParticipationDropLinkPreview
        href="https://site.com/waves/quorum-wave?drop=drop-1"
        waveId="quorum-wave"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockWaveDropQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ drop_type: ApiDropType.Chat }),
          partId: 1,
        })
      );
    });
    expect(mockQuorumParticipationDrop).not.toHaveBeenCalled();
  });
});
