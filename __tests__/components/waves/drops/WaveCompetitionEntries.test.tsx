import { WaveCompetitionEntries } from "@/components/waves/drops/WaveCompetitionEntries";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseWaveCompetitionEntries = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/hooks/useWaveCompetitionEntries", () => ({
  getWaveCompetitionEntriesQueryKey: ({
    authorId,
    waveId,
    kind,
  }: {
    authorId: string;
    waveId: string;
    kind: string;
  }) => [
    "DROPS",
    {
      author_id: authorId,
      wave_id: waveId,
      scope: `wave-competition-${kind}`,
    },
  ],
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
  SingleWaveDropVote: ({ onVoteSuccess }: { onVoteSuccess: () => void }) => (
    <button type="button" data-testid="vote-control" onClick={onVoteSuccess}>
      Vote
    </button>
  ),
  SingleWaveDropVoteSize: { MINI: "mini" },
}));

const createDrop = ({
  dropType,
  votingOpen = true,
}: {
  readonly dropType: ApiDropType;
  readonly votingOpen?: boolean;
}): ApiDrop & { readonly voting_open: boolean } =>
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
      mockEntriesResult([createDrop({ dropType: ApiDropType.Participatory })])
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
    [
      "closed active entry",
      createDrop({
        dropType: ApiDropType.Participatory,
        votingOpen: false,
      }),
    ],
    ["winning entry", createDrop({ dropType: ApiDropType.Winner })],
  ])("does not offer voting for a %s", (_label, drop) => {
    mockUseWaveCompetitionEntries.mockReturnValue(mockEntriesResult([drop]));

    render(
      <WaveCompetitionEntries
        authorId="author-1"
        wave={wave}
        kind={drop.drop_type === ApiDropType.Winner ? "winners" : "active"}
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
      ...mockEntriesResult([
        createDrop({ dropType: ApiDropType.Participatory }),
      ]),
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

  it("refreshes the open entry list after a vote", () => {
    mockUseWaveCompetitionEntries.mockReturnValue(
      mockEntriesResult([createDrop({ dropType: ApiDropType.Participatory })])
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

    fireEvent.click(screen.getByTestId("vote-control"));

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["DROP"],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        "DROPS",
        {
          author_id: "author-1",
          wave_id: "wave-1",
          scope: "wave-competition-active",
        },
      ],
    });
  });
});
