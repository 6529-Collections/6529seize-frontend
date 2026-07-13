import { WaveCompetitionEntries } from "@/components/waves/drops/WaveCompetitionEntries";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseWaveCompetitionEntries = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/hooks/useWaveCompetitionEntries", () => ({
  useWaveCompetitionEntries: (...args: unknown[]) =>
    mockUseWaveCompetitionEntries(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="media" />,
}));

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: () => <div data-testid="vote-progress" />,
}));

jest.mock("@/components/waves/drop/SingleWaveDropVote", () => ({
  SingleWaveDropVote: () => <div data-testid="vote-control" />,
  SingleWaveDropVoteSize: { MINI: "mini" },
}));

const createDrop = (dropType: ApiDropType, votingOpen: boolean): ApiDrop =>
  ({
    id: `${dropType}-drop`,
    title: "Entry title",
    drop_type: dropType,
    voting_open: votingOpen,
    wave: { id: "wave-1", name: "Cool Comp" },
    parts: [
      {
        content: "Entry text",
        media: [],
        attachments: [],
      },
    ],
    rating: 42,
    rating_prediction: 45,
    rank: dropType === ApiDropType.Winner ? 1 : null,
    created_at: 1_720_000_000_000,
  }) as ApiDrop;

const wave = { id: "wave-1", name: "Cool Comp" } as ApiDrop["wave"];

const mockEntriesResult = (entries: ApiDrop[]) => ({
  entries,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
});

describe("WaveCompetitionEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("offers voting only for an active entry while voting is open", () => {
    mockUseWaveCompetitionEntries.mockReturnValue(
      mockEntriesResult([createDrop(ApiDropType.Participatory, true)])
    );

    render(
      <WaveCompetitionEntries
        authorId="author-1"
        wave={wave}
        kind="active"
        isOpen={true}
        isApp={false}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("vote-control")).toBeInTheDocument();
    expect(mockUseWaveCompetitionEntries).toHaveBeenCalledWith({
      authorId: "author-1",
      wave,
      kind: "active",
      enabled: true,
    });
  });

  it.each([
    [ApiDropType.Participatory, false, "closed active entry"],
    [ApiDropType.Winner, true, "winning entry"],
  ])("does not offer voting for a %s", (dropType, votingOpen) => {
    mockUseWaveCompetitionEntries.mockReturnValue(
      mockEntriesResult([createDrop(dropType, votingOpen)])
    );

    render(
      <WaveCompetitionEntries
        authorId="author-1"
        wave={wave}
        kind={dropType === ApiDropType.Winner ? "winners" : "active"}
        isOpen={true}
        isApp={false}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("vote-control")).toBeNull();
  });

  it("loads another page only after the viewer requests it", () => {
    const fetchNextPage = jest.fn();
    mockUseWaveCompetitionEntries.mockReturnValue({
      ...mockEntriesResult([createDrop(ApiDropType.Participatory, true)]),
      fetchNextPage,
      hasNextPage: true,
    });

    render(
      <WaveCompetitionEntries
        authorId="author-1"
        wave={wave}
        kind="active"
        isOpen={true}
        isApp={false}
        onDropClick={jest.fn()}
      />
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Load more entries" }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
