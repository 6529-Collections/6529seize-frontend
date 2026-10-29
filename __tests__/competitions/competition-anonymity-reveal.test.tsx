import { act, render, screen, waitFor, within } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { SingleWaveDropAuthor } from "@/components/waves/drop/SingleWaveDropAuthor";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import {
  competitionCardDrop,
  fetchCompetitionEntryDrop,
} from "@/services/api/competition-entry-drops-api";

let mockListener: (event: unknown) => void;
const mockCompetition = {
  id: "competition",
  wave_id: "wave",
  title: "Anonymous art",
  type: "RANK",
  permissions: { vote: true },
  voting: {
    credit_type: "TDH",
    credit_scope: "WAVE",
    starts_at: null,
    ends_at: null,
  },
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({ competition: mockCompetition }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({
    subscribe: (_type: unknown, listener: (event: unknown) => void) => {
      mockListener = listener;
      return () => undefined;
    },
  }),
}));
jest.mock("@/services/api/competition-entry-drops-api", () => ({
  competitionCardDrop: jest.fn(),
  fetchCompetitionEntryDrop: jest.fn(),
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => null,
  UserCICAndLevelSize: { SMALL: "small" },
}));
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => null,
}));

const author = (entryId: string, revealed = false) =>
  ({
    id: revealed ? "real-author" : `anonymous-${entryId}`,
    handle: revealed ? "Alice" : "Anonymous",
    ...(revealed ? {} : { is_anonymous: true }),
    primary_address: "",
    pfp: null,
    level: 0,
    classification: ApiProfileClassification.Pseudonym,
  }) as ApiProfileMin;
const drop = (entryId: string, revealed = false, waveId = "wave") =>
  ({
    id: `drop-${entryId}`,
    author: author(entryId, revealed),
    wave: { id: waveId },
    created_at: 1,
    parts: [],
  }) as ApiDrop;
const context = (entryId: string, revealed = false) => ({
  entry: {
    id: entryId,
    wave_id: "wave",
    competition_id: "competition",
    drop_id: `drop-${entryId}`,
    submitter: author(entryId, revealed),
    status: revealed
      ? ApiCompetitionEntryStatus.Winner
      : ApiCompetitionEntryStatus.Active,
    config_version: 1,
    submitted_at: 1,
    rank: revealed ? 1 : null,
    won_at: revealed ? 100 : null,
    decision_id: revealed ? "decision" : null,
  },
  awards: [],
  vote_summary: {
    rating: 1,
    realtime_rating: 1,
    rating_prediction: 1,
    rank: 1,
    raters_count: 1,
    user_vote: 0,
    top_raters: [],
  },
});

it("refreshes winner identity in cached cards, chat and detail after the decision event while other entries stay anonymous", async () => {
  jest.useFakeTimers();
  let won = false;
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  const references = ["winner", "other"].map((entryId) => ({
    entryId,
    dropId: `drop-${entryId}`,
  }));
  const cards = {
    contexts: [context("winner"), context("other")],
    updatedAt: Date.now(),
  };
  const detailKey = [QueryKey.DROP, { drop_id: "drop-winner" }];
  const chatKey = [QueryKey.DROPS, { waveId: "wave" }];
  const unrelated = jest.fn(async () => drop("elsewhere", false, "elsewhere"));
  jest
    .mocked(competitionCardDrop)
    .mockImplementation((item) => drop(item.entry.id));
  jest.mocked(fetchCompetitionEntryDrop).mockImplementation(
    async (_identity, _viewer, entryId, _dropId, _signal, cached) =>
      ({
        ...context(entryId, won && entryId === "winner"),
        competition: mockCompetition,
        // The optimized card reader reuses original content even after an identity reveal.
        original: cached?.original ?? drop(entryId),
      }) as NonNullable<Awaited<ReturnType<typeof fetchCompetitionEntryDrop>>>
  );
  function Entries() {
    useCompetitionEvents("wave");
    const entries = useCompetitionEntryDrops(references, cards);
    useQuery({
      queryKey: chatKey,
      queryFn: async () => [drop("winner", won), drop("other")],
    });
    useQuery({ queryKey: detailKey, queryFn: async () => drop("winner", won) });
    useQuery({
      queryKey: [QueryKey.DROP, { drop_id: "elsewhere" }],
      queryFn: unrelated,
    });
    return (
      <>
        {entries.map(
          (entry, index) =>
            entry.data && (
              <article
                key={references[index]!.entryId}
                aria-label={references[index]!.entryId}
              >
                <SingleWaveDropAuthor drop={entry.data.drop} />
              </article>
            )
        )}
      </>
    );
  }
  const view = render(
    <QueryClientProvider client={client}>
      <Entries />
    </QueryClientProvider>
  );
  try {
    await waitFor(() => expect(client.getQueryData(chatKey)).toBeDefined());
    expect(
      within(screen.getByRole("article", { name: "winner" })).getByText(
        "Anonymous"
      )
    ).toBeInTheDocument();
    won = true;
    await act(async () => {
      mockListener({
        event_id: "decision-event",
        event_version: 1,
        event_type: "COMPETITION_DECISION_COMPLETED",
        wave_id: "wave",
        competition_id: "competition",
      });
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() =>
      expect(
        within(screen.getByRole("article", { name: "winner" })).getByRole(
          "link",
          { name: "Alice" }
        )
      ).toHaveAttribute("href", "/Alice")
    );
    const other = within(screen.getByRole("article", { name: "other" }));
    expect(other.getByText("Anonymous")).toBeInTheDocument();
    expect(other.queryByRole("link")).toBeNull();
    expect(client.getQueryData<ApiDrop>(detailKey)?.author.handle).toBe(
      "Alice"
    );
    expect(
      client.getQueryData<ApiDrop[]>(chatKey)?.map((item) => item.author.handle)
    ).toEqual(["Alice", "Anonymous"]);
    expect(unrelated).toHaveBeenCalledTimes(1);
  } finally {
    view.unmount();
    client.clear();
    jest.useRealTimers();
  }
});
