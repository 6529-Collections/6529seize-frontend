import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SingleWaveDropVote } from "@/components/waves/drop/SingleWaveDropVote";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  fetchDropCompetitionContext,
  fetchCompetitionCredits,
  setCompetitionVote,
} from "@/services/api/competitions-api";

jest.mock(
  "next/dynamic",
  () => () =>
    function LegacyVote() {
      return <div>Legacy voting</div>;
    }
);
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "viewer" },
    requestAuth: async () => ({ success: true }),
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: () => jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
  newCompetitionRequestKey: () => "request-key",
  isRejectedCompetitionCommand: () => false,
}));
jest.mock("@/services/api/competitions-api", () => ({
  fetchDropCompetitionContext: jest.fn(),
  fetchCompetitionCredits: jest.fn(),
  setCompetitionVote: jest.fn(),
  competitionScope: (identity: { waveId: string; competitionId: string }) => ({
    wave_id: identity.waveId,
    competition_id: identity.competitionId,
  }),
  invalidateCompetition: jest.fn(),
}));
const drop = {
  id: "drop",
  drop_type: "PARTICIPATORY",
  wave: { id: "wave", voting_credit_type: "TDH" },
  context_profile_context: { min_rating: 0, max_rating: 0 },
} as ApiDrop;
const context = {
  competition: {
    id: "competition",
    wave_id: "wave",
    config_version: 4,
    voting: { credit_type: "TDH_PLUS_XTDH", signature_required: false },
    permissions: { vote: true },
  },
  entry: {
    id: "entry",
    competition_id: "competition",
    wave_id: "wave",
    drop_id: "drop",
    status: "ACTIVE",
  },
};
function mount(voteMode: "slider" | "numeric" = "numeric") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SingleWaveDropVote drop={drop} voteMode={voteMode} />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue(context as never);
  jest.mocked(fetchCompetitionCredits).mockResolvedValue({
    available: 1500,
    spent: 0,
    remaining: 1500,
    current_vote: 0,
    min_vote: -1500,
    max_vote: 1500,
  } as never);
  jest.mocked(setCompetitionVote).mockResolvedValue({} as never);
});
it("uses the entry budget and competition vote endpoint despite the parent wave's zero limits", async () => {
  mount();
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  expect(input).toHaveAttribute("max", "1500");
  expect(screen.getByText("TDH + XTDH")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() =>
    expect(setCompetitionVote).toHaveBeenCalledWith(
      { waveId: "wave", competitionId: "competition" },
      "entry",
      { value: 25, config_version: 4, idempotency_key: "request-key" }
    )
  );
  expect(fetchCompetitionCredits).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "competition" },
    "entry",
    expect.any(AbortSignal)
  );
  expect(screen.queryByText("Legacy voting")).not.toBeInTheDocument();
});
it("keeps slider mode with the competition range", async () => {
  mount("slider");
  const sliders = await screen.findAllByRole("slider");
  for (const slider of sliders) {
    expect(slider).toHaveAttribute("max", "1500");
    expect(slider).toHaveAttribute("min", "-1500");
  }
});
it("keeps legacy voting for a verified legacy drop", async () => {
  jest
    .mocked(fetchDropCompetitionContext)
    .mockResolvedValue({ competition: null, entry: null });
  mount();
  expect(await screen.findByText("Legacy voting")).toBeInTheDocument();
  expect(fetchCompetitionCredits).not.toHaveBeenCalled();
});
it("does not fall back to the wrong voting endpoint when lookup fails", async () => {
  jest
    .mocked(fetchDropCompetitionContext)
    .mockRejectedValue(new Error("Unavailable"));
  mount();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("Legacy voting")).not.toBeInTheDocument();
  expect(fetchCompetitionCredits).not.toHaveBeenCalled();
});
