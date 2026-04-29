import { waitFor } from "@testing-library/react";

import QuorumParticipationDropLinkPreview from "@/components/waves/quorum/QuorumParticipationDropLinkPreview";
import { ApiDropType } from "@/generated/models/ApiDropType";
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
    const drop = buildDrop();
    commonApiFetchMock.mockResolvedValue({
      drops: [drop],
      wave: { id: "quorum-wave", name: "Quorum" },
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
      endpoint: "waves/quorum-wave/drops",
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
