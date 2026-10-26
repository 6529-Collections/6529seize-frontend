import { waitFor } from "@testing-library/react";

import WaveDropLinkPreview from "@/components/waves/drops/WaveDropLinkPreview";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import { useWaveById } from "@/hooks/useWaveById";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { renderWithQueryClient } from "../../../utils/reactQuery";

const mockDrop = jest.fn(() => <div data-testid="drop" />);
const mockWaveDropQuote = jest.fn(() => <div data-testid="quote" />);
const mockLinkHandlerFrame = jest.fn(({ children }: any) => (
  <div data-testid="link-frame">{children}</div>
));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/services/api/drop-api", () => {
  const { QueryKey: ActualQueryKey } = jest.requireActual(
    "@/components/react-query-wrapper/ReactQueryWrapper"
  );
  return {
    DROP_DETAIL_STALE_TIME_MS: 60 * 1000,
    fetchDropByIdBatched: jest.fn(),
    getDropQueryKey: (dropId: string | null | undefined) => [
      ActualQueryKey.DROP,
      { drop_id: dropId ?? null },
    ],
  };
});

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: jest.fn(),
}));

jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: (props: any) => mockDrop(props),
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
const useWaveByIdMock = useWaveById as jest.MockedFunction<typeof useWaveById>;
const useApprovalWaveStatusMock = useApprovalWaveStatus as jest.MockedFunction<
  typeof useApprovalWaveStatus
>;

const approvalWave = {
  id: "wave-1",
  wave: { type: "APPROVE", winning_threshold: 12 },
} as any;

const buildDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    serial_no: 7,
    drop_type: ApiDropType.Participatory,
    wave: { id: "wave-1", name: "Rank Wave" },
    reply_to: null,
    author: { handle: "alice" },
    title: "Submission",
    parts: [{ part_id: 1, content: "Body", media: [] }],
    metadata: [],
    created_at: 1000,
    rank: null,
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    referenced_nfts: [],
    ...overrides,
  }) as any;

const buildWaveOverview = () =>
  ({
    id: "wave-1",
    name: "Rank Wave",
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
    title: "Submission",
    content: "Body",
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
      badges: {},
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

describe("WaveDropLinkPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWaveByIdMock.mockReturnValue({
      wave: approvalWave,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as any);
    useApprovalWaveStatusMock.mockReturnValue({
      winningThreshold: 12,
      winningThresholdMinDurationMs: 120_000,
      approvedCount: 3,
      closeStatus: null,
      isApprovalStatusLoading: false,
      isApprovalStatusError: false,
      isVotingClosed: true,
      isVotingControlsLocked: true,
      retryApprovalStatus: null,
    });
  });

  it("fetches by drop id and renders participatory drops through Drop", async () => {
    fetchDropByIdBatchedMock.mockResolvedValue(buildDrop());

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?drop=drop-1"
        waveId="wave-1"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ id: "drop-1" }),
          showInteractions: false,
          showReplyAndQuote: false,
        })
      );
    });
    expect(fetchDropByIdBatchedMock).toHaveBeenCalledWith("drop-1");
  });

  it("fetches by serial number", async () => {
    const drop = buildDropV2({ wave: buildWaveOverview() });
    commonApiFetchMock.mockResolvedValue({
      data: [drop],
    });

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?serialNo=7"
        waveId="wave-1"
        serialNo="7"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ id: "drop-1" }),
        })
      );
    });
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/drops",
      params: {
        serial_nos: "7",
        page_size: "1",
      },
      signal: expect.objectContaining({ aborted: false }),
    });
  });

  it("passes approval wave status and embed guards into Drop", async () => {
    fetchDropByIdBatchedMock.mockResolvedValue(buildDrop());

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?drop=drop-1"
        waveId="wave-1"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
        embedPath={["parent-drop"]}
        quotePath={["wave-1:1"]}
        embedDepth={2}
        maxEmbedDepth={4}
      />
    );

    await waitFor(() => {
      expect(mockDrop).toHaveBeenCalledWith(
        expect.objectContaining({
          winningThreshold: 12,
          winningThresholdMinDurationMs: 120_000,
          isVotingClosed: true,
          isVotingControlsLocked: true,
          embedPath: ["parent-drop"],
          quotePath: ["wave-1:1"],
          embedDepth: 2,
          maxEmbedDepth: 4,
        })
      );
    });
    expect(useWaveByIdMock).toHaveBeenLastCalledWith("wave-1", {
      enabled: true,
    });
    expect(useApprovalWaveStatusMock).toHaveBeenLastCalledWith({
      wave: approvalWave,
    });
  });

  it("falls back to WaveDropQuote for non-participatory drops", async () => {
    fetchDropByIdBatchedMock.mockResolvedValue(
      buildDrop({ drop_type: ApiDropType.Chat })
    );

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?drop=drop-1"
        waveId="wave-1"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockWaveDropQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drop: expect.objectContaining({ drop_type: ApiDropType.Chat }),
          partId: 1,
          isNotFound: false,
        })
      );
    });
    expect(mockDrop).not.toHaveBeenCalled();
  });

  it("passes hidden link preview setting from fetched chat drops into WaveDropQuote", async () => {
    fetchDropByIdBatchedMock.mockResolvedValue(
      buildDrop({
        drop_type: ApiDropType.Chat,
        hide_link_preview: true,
      })
    );

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?drop=drop-1"
        waveId="wave-1"
        dropId="drop-1"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        mockWaveDropQuote.mock.calls.some(([props]) => {
          return (
            props.hideLinkPreviews === true &&
            props.drop?.drop_type === ApiDropType.Chat &&
            props.drop?.hide_link_preview === true
          );
        })
      ).toBe(true);
    });
    expect(mockWaveDropQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        drop: expect.objectContaining({
          drop_type: ApiDropType.Chat,
          hide_link_preview: true,
        }),
        hideLinkPreviews: true,
      })
    );
    expect(mockDrop).not.toHaveBeenCalled();
  });

  it("falls back to a not-found quote when the drop is missing", async () => {
    commonApiFetchMock.mockResolvedValue({
      data: [],
    });

    renderWithQueryClient(
      <WaveDropLinkPreview
        href="https://site.com/waves/wave-1?serialNo=99"
        waveId="wave-1"
        serialNo="99"
        onQuoteClick={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockWaveDropQuote).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drop: null,
          isNotFound: true,
        })
      );
    });
    expect(mockDrop).not.toHaveBeenCalled();
  });
});
