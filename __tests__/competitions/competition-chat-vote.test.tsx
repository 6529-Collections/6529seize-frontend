import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import * as competitionVoteCache from "@/components/react-query-wrapper/utils/updateCompetitionVoteInCache";
import { SingleWaveDropVoteSize } from "@/components/waves/drop/SingleWaveDropVote.types";
import { SingleWaveDropVote } from "@/components/waves/drop/SingleWaveDropVote";
import { commonApiPost } from "@/services/api/common-api";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import {
  fetchDropCompetitionContext,
  fetchCompetitionCredits,
  setCompetitionVote,
  invalidateCompetition,
} from "@/services/api/competitions-api";

jest.mock(
  "next/dynamic",
  () => () =>
    function LegacyVote() {
      return <div>Legacy voting</div>;
    }
);
let mockSignedIn = true;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockSignedIn ? { id: "viewer" } : null,
    setToast: jest.fn(),
    requestAuth: async () => ({ success: true }),
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x123", isSafeWallet: false }),
}));
jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiPost: jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: jest.fn(() => "viewer:self"),
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
  isCompetitionAccessError: jest.requireActual("@/helpers/competition.helpers")
    .isCompetitionAccessError,
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
const knownContext = {
  viewer: "viewer:self",
  waveId: "wave",
  dropId: "drop",
  data: context,
};
const initialBudget = {
  competition_id: "competition",
  profile_id: "viewer",
  entry_id: "entry",
  credit_type: "TDH_PLUS_XTDH",
  credit_scope: "WAVE",
  available: 1500,
  spent: 0,
  remaining: 1500,
  current_vote: 0,
  min_vote: -1500,
  max_vote: 1500,
} as ApiCompetitionCreditBudget;
function mount(
  voteMode: "slider" | "numeric" | null = "numeric",
  voteDrop: ApiDrop = drop,
  onClose?: () => void,
  size = SingleWaveDropVoteSize.NORMAL
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rendered = render(
    <QueryClientProvider client={client}>
      <SingleWaveDropVote
        drop={voteDrop}
        size={size}
        voteMode={voteMode ?? undefined}
        onVoteRequestStarted={onClose}
      />
    </QueryClientProvider>
  );
  return { ...rendered, client };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockSignedIn = true;
  jest.mocked(useCompetitionViewer).mockReturnValue("viewer:self");
  jest.mocked(fetchDropCompetitionContext).mockResolvedValue(context as never);
  jest.mocked(fetchCompetitionCredits).mockResolvedValue(initialBudget);
  jest
    .mocked(setCompetitionVote)
    .mockImplementation(async (_identity, _entry, body) => ({
      ...initialBudget,
      current_vote: body.value,
      spent: Math.abs(body.value),
      remaining: initialBudget.available - Math.abs(body.value),
    }));
  jest.mocked(invalidateCompetition).mockResolvedValue(undefined);
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
it("uses the passed competition and entry without another lookup and fetches fresh vote credits", async () => {
  const voteDrop = { ...drop, competition_context: knownContext };
  mount("numeric", voteDrop);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  expect(fetchDropCompetitionContext).not.toHaveBeenCalled();
  expect(fetchCompetitionCredits).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "competition" },
    "entry",
    expect.any(AbortSignal)
  );
  fireEvent.change(input, { target: { value: "-25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() =>
    expect(setCompetitionVote).toHaveBeenCalledWith(
      { waveId: "wave", competitionId: "competition" },
      "entry",
      { value: -25, config_version: 4, idempotency_key: "request-key" }
    )
  );
});
it.each([
  { ...knownContext, viewer: "other:self" },
  { ...knownContext, viewer: "viewer:proxy" },
  { ...knownContext, waveId: "other" },
  { ...knownContext, dropId: "other" },
  {
    ...knownContext,
    data: { ...context, entry: { ...context.entry, drop_id: "other" } },
  },
  {
    ...knownContext,
    data: { ...context, entry: { ...context.entry, competition_id: "other" } },
  },
])(
  "resolves context again when passed context belongs to another viewer or artwork (%j)",
  async (provided) => {
    const voteDrop = { ...drop, competition_context: provided };
    mount("numeric", voteDrop);
    await screen.findByRole("spinbutton", { name: "Your vote" });
    expect(fetchDropCompetitionContext).toHaveBeenCalledWith(
      "wave",
      "drop",
      expect.any(AbortSignal)
    );
  }
);
it("uses an already resolved legacy context without repeating the lookup", async () => {
  const voteDrop = {
    ...drop,
    competition_context: {
      ...knownContext,
      data: { competition: null, entry: null },
    },
  };
  mount("numeric", voteDrop);
  expect(await screen.findByText("Legacy voting")).toBeInTheDocument();
  expect(fetchDropCompetitionContext).not.toHaveBeenCalled();
  expect(fetchCompetitionCredits).not.toHaveBeenCalled();
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
it("closes after confirmation with fresh credits while background refresh is still pending", async () => {
  let finishRefresh!: () => void;
  jest.mocked(invalidateCompetition).mockReturnValue(
    new Promise<void>((resolve) => {
      finishRefresh = resolve;
    })
  );
  const onClose = jest.fn();
  const { client } = mount("numeric", drop, onClose);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(
    client.getQueryData([
      QueryKey.COMPETITION_CREDITS,
      {
        wave_id: "wave",
        competition_id: "competition",
        viewer: "viewer:self",
        entry_id: "entry",
      },
    ])
  ).toMatchObject({ current_vote: 25, spent: 25, remaining: 1475 });
  expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  finishRefresh();
});
it("keeps the confirmed vote when a background refresh fails", async () => {
  jest
    .mocked(invalidateCompetition)
    .mockRejectedValue(new Error("Refresh failed"));
  const { client } = mount();
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "-25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await screen.findByText("Saved");
  expect(input).toHaveValue(-25);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(fetchCompetitionCredits).toHaveBeenCalledTimes(1);
  jest
    .mocked(fetchCompetitionCredits)
    .mockRejectedValue(
      Object.assign(new Error("Temporary refresh failure"), { status: 503 })
    );
  await act(async () => {
    await client.refetchQueries({ queryKey: [QueryKey.COMPETITION_CREDITS] });
  });
  expect(input).toHaveValue(-25);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  jest
    .mocked(fetchCompetitionCredits)
    .mockRejectedValue(
      Object.assign(new Error("Access denied"), { status: 403 })
    );
  await act(async () => {
    await client.refetchQueries({ queryKey: [QueryKey.COMPETITION_CREDITS] });
  });
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
it("does not close another modal when a submitted form unmounts before confirmation", async () => {
  let confirm!: (value: ApiCompetitionCreditBudget) => void;
  jest.mocked(setCompetitionVote).mockReturnValue(
    new Promise<ApiCompetitionCreditBudget>((resolve) => {
      confirm = resolve;
    })
  );
  const onClose = jest.fn();
  const { unmount } = mount("numeric", drop, onClose);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() => expect(setCompetitionVote).toHaveBeenCalledTimes(1));
  unmount();
  confirm({ ...initialBudget, current_vote: 25, spent: 25, remaining: 1475 });
  await waitFor(() => expect(invalidateCompetition).toHaveBeenCalled());
  expect(onClose).not.toHaveBeenCalled();
});
it("invalidates the old viewer during commit before passive effects can flush", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(
    [QueryKey.COMPETITION_HUB, { wave_id: "wave", viewer: "viewer:self" }],
    { legacy_primary_competition_id: "competition" }
  );
  const legacyKey = [QueryKey.DROPS_LEADERBOARD, { waveId: "wave" }];
  const legacy = {
    pages: [
      { drops: [{ id: "drop", context_profile_context: { rating: 0 } }] },
    ],
    pageParams: [1],
  };
  client.setQueryData(legacyKey, legacy);
  let releaseCache!: () => void;
  const cacheGate = new Promise<void>((resolve) => {
    releaseCache = resolve;
  });
  let checkViewer: (() => boolean) | undefined;
  let currentDuringCommit: boolean | undefined;
  const updateCache = competitionVoteCache.updateCompetitionVoteInCache;
  const updateSpy = jest
    .spyOn(competitionVoteCache, "updateCompetitionVoteInCache")
    .mockImplementation(async (queryClient, result) => {
      checkViewer = result.isCurrentViewer;
      await cacheGate;
      await updateCache(queryClient, result);
    });
  const onClose = jest.fn();
  function VoteHarness({ switched }: { readonly switched: boolean }) {
    useLayoutEffect(() => {
      if (switched) {
        currentDuringCommit = checkViewer?.();
        releaseCache();
      }
    }, [switched]);
    return (
      <QueryClientProvider client={client}>
        <SingleWaveDropVote
          drop={drop}
          voteMode="numeric"
          onVoteRequestStarted={onClose}
        />
      </QueryClientProvider>
    );
  }
  try {
    const { rerender } = render(<VoteHarness switched={false} />);
    const input = await screen.findByRole("spinbutton", { name: "Your vote" });
    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
    await waitFor(() => expect(checkViewer).toBeDefined());
    jest.mocked(useCompetitionViewer).mockReturnValue("viewer:proxy");
    rerender(<VoteHarness switched />);
    expect(currentDuringCommit).toBe(false);
    await waitFor(() => expect(invalidateCompetition).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(client.getQueryData(legacyKey)).toBe(legacy);
  } finally {
    releaseCache();
    updateSpy.mockRestore();
    client.clear();
  }
});
it("keeps voting open when saving the vote fails", async () => {
  jest.mocked(setCompetitionVote).mockRejectedValue(new Error("Save failed"));
  const onClose = jest.fn();
  mount("numeric", drop, onClose);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await screen.findByRole("alert");
  expect(onClose).not.toHaveBeenCalled();
  expect(invalidateCompetition).not.toHaveBeenCalled();
  expect(screen.queryByText("Saved")).not.toBeInTheDocument();
});

const replyDrop = {
  ...drop,
  wave: { ...drop.wave, authenticated_user_eligible_to_chat: true },
  parts: [{ part_id: 7 }],
} as ApiDrop;
it("restores Explain vote for proxy competition votes after the vote succeeds", async () => {
  jest.mocked(useCompetitionViewer).mockReturnValue("viewer:proxy");
  jest.mocked(commonApiPost).mockResolvedValue({ id: "reply" } as never);
  mount("numeric", replyDrop);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
  const rationale = screen.getByLabelText("Optional rationale reply");
  expect(rationale).toHaveValue("");
  expect(rationale).toHaveAttribute(
    "placeholder",
    "Vote rationale (+25 at time of posting):"
  );
  fireEvent.change(rationale, { target: { value: "Proxy vote rationale" } });
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() =>
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "drops",
        body: expect.objectContaining({
          wave_id: "wave",
          reply_to: { drop_id: "drop", drop_part_id: 7 },
          parts: [expect.objectContaining({ content: "Proxy vote rationale" })],
        }),
      })
    )
  );
  expect(setCompetitionVote).toHaveBeenCalledTimes(1);
});
it.each([SingleWaveDropVoteSize.MINI, SingleWaveDropVoteSize.NORMAL])(
  "displays the generated %s rationale as a placeholder without blocking an untouched reply",
  async (size) => {
    jest.mocked(commonApiPost).mockResolvedValue({ id: "reply" } as never);
    mount("numeric", replyDrop, undefined, size);
    await screen.findByRole("spinbutton", { name: "Your vote" });
    fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
    const rationale = screen.getByLabelText("Optional rationale reply");
    const save = screen.getByRole("button", { name: "Save vote" });
    expect(rationale).toHaveValue("");
    expect(rationale).toHaveAttribute(
      "placeholder",
      "Vote rationale (0 at time of posting):"
    );
    expect(save).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(save);
    await waitFor(() =>
      expect(commonApiPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            parts: [
              expect.objectContaining({
                content: "Vote rationale (0 at time of posting):",
              }),
            ],
          }),
        })
      )
    );
    expect(setCompetitionVote).toHaveBeenCalledTimes(1);
  }
);
it.each([SingleWaveDropVoteSize.MINI, SingleWaveDropVoteSize.NORMAL])(
  "keeps %s placeholder text out of typed drafts and preserves empty-field validation",
  async (size) => {
    jest.mocked(commonApiPost).mockResolvedValue({ id: "reply" } as never);
    mount("numeric", replyDrop, undefined, size);
    const input = await screen.findByRole("spinbutton", { name: "Your vote" });
    fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
    const rationale = screen.getByLabelText("Optional rationale reply");
    const save = screen.getByRole("button", { name: "Save vote" });
    fireEvent.change(input, { target: { value: "25" } });
    expect(rationale).toHaveValue("");
    expect(rationale).toHaveAttribute(
      "placeholder",
      "Vote rationale (+25 at time of posting):"
    );
    expect(save).toBeEnabled();
    expect(setCompetitionVote).not.toHaveBeenCalled();
    expect(commonApiPost).not.toHaveBeenCalled();
    fireEvent.change(rationale, { target: { value: "My explanation" } });
    expect(rationale).toHaveValue("My explanation");
    fireEvent.change(rationale, { target: { value: "" } });
    expect(save).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add rationale text or turn Explain vote off."
    );
    fireEvent.change(rationale, { target: { value: "My explanation" } });
    fireEvent.change(input, { target: { value: "-25" } });
    fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
    fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
    expect(rationale).toHaveValue("My explanation");
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() =>
      expect(commonApiPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            parts: [expect.objectContaining({ content: "My explanation" })],
          }),
        })
      )
    );
    expect(setCompetitionVote).toHaveBeenCalledTimes(1);
  }
);
it("blocks empty enabled replies before submitting a vote", async () => {
  mount("numeric", replyDrop);
  await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
  fireEvent.change(screen.getByLabelText("Optional rationale reply"), {
    target: { value: " " },
  });
  expect(screen.getByRole("button", { name: "Save vote" })).toBeDisabled();
  expect(setCompetitionVote).not.toHaveBeenCalled();
});
it("does not post a reply if saving the competition vote fails", async () => {
  jest
    .mocked(setCompetitionVote)
    .mockRejectedValueOnce(new Error("Save failed"));
  mount("numeric", replyDrop);
  const input = await screen.findByRole("spinbutton", { name: "Your vote" });
  fireEvent.change(input, { target: { value: "25" } });
  fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await screen.findByRole("alert");
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("offers both modes in inline competition forms and preserves the vote and reply draft", async () => {
  mount(null, replyDrop);
  await screen.findAllByRole("slider");
  fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Your vote" }), {
    target: { value: "-123" },
  });
  fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
  fireEvent.change(screen.getByLabelText("Optional rationale reply"), {
    target: { value: "A public explanation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Slider" }));
  expect(screen.getAllByRole("slider").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
  expect(screen.getByRole("spinbutton", { name: "Your vote" })).toHaveValue(
    -123
  );
  expect(screen.getByLabelText("Optional rationale reply")).toHaveValue(
    "A public explanation"
  );
  expect(setCompetitionVote).not.toHaveBeenCalled();
  expect(commonApiPost).not.toHaveBeenCalled();
});
it("does not duplicate the mode switch supplied by a voting dialog", async () => {
  mount("slider", replyDrop);
  await screen.findAllByRole("slider");
  expect(screen.queryByRole("group", { name: "Vote input mode" })).toBeNull();
});
it.each([0, -1500])(
  "uses the same limits in both inline entry modes with minimum %s",
  async (min) => {
    jest
      .mocked(fetchCompetitionCredits)
      .mockResolvedValue({ ...initialBudget, min_vote: min });
    mount(null);
    const sliders = await screen.findAllByRole("slider");
    expect(sliders[0]).toHaveAttribute("min", String(min));
    fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
    const input = screen.getByRole("spinbutton", { name: "Your vote" });
    expect(input).toHaveAttribute("min", String(min));
    fireEvent.change(input, { target: { value: "-25" } });
    expect(
      screen.getByRole("button", { name: "Save vote" }).hasAttribute("disabled")
    ).toBe(min === 0);
  }
);
it("keeps a vote saved when posting the public explanation fails", async () => {
  jest.mocked(commonApiPost).mockRejectedValueOnce(new Error("Reply failed"));
  mount(null, replyDrop);
  await screen.findAllByRole("slider");
  fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Your vote" }), {
    target: { value: "25" },
  });
  fireEvent.click(screen.getByRole("switch", { name: "Explain vote" }));
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() => expect(commonApiPost).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("spinbutton", { name: "Your vote" })).toHaveValue(25);
  expect(screen.getByText("Saved")).toBeInTheDocument();
});

it("shows the sign-in prompt without vote modes for a signed-out viewer", async () => {
  mockSignedIn = false;
  jest.mocked(useCompetitionViewer).mockReturnValue(null);
  mount(null);
  await screen.findByText("Connect your wallet to participate.");
  expect(screen.queryByRole("group", { name: "Vote input mode" })).toBeNull();
  expect(screen.queryByRole("slider")).toBeNull();
  expect(fetchCompetitionCredits).not.toHaveBeenCalled();
});
it("hides the MINI vote footer for a signed-out viewer", async () => {
  mockSignedIn = false;
  jest.mocked(useCompetitionViewer).mockReturnValue(null);
  mount(null, drop, undefined, SingleWaveDropVoteSize.MINI);
  const prompt = await screen.findByText("Connect your wallet to participate.");
  expect(prompt).not.toBeVisible();
  expect(screen.queryByRole("group", { name: "Vote input mode" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Save vote" })).toBeNull();
  expect(fetchCompetitionCredits).not.toHaveBeenCalled();
});
it("offers both modes without a reply option when the voter cannot chat", async () => {
  mount(null, {
    ...replyDrop,
    wave: { ...replyDrop.wave, authenticated_user_eligible_to_chat: false },
  });
  await screen.findAllByRole("slider");
  fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
  expect(screen.getByRole("spinbutton", { name: "Your vote" })).toBeEnabled();
  expect(screen.queryByRole("switch", { name: "Explain vote" })).toBeNull();
});
it.each(["closed", "inactive"])(
  "keeps %s voting disabled in either input mode",
  async (state) => {
    jest.mocked(fetchDropCompetitionContext).mockResolvedValue({
      ...context,
      competition: {
        ...context.competition,
        permissions: { vote: state !== "closed" },
      },
      entry: {
        ...context.entry,
        status: state === "inactive" ? "WITHDRAWN" : "ACTIVE",
      },
    } as never);
    mount(null);
    await screen.findAllByRole("slider");
    expect(screen.getByRole("button", { name: "Save vote" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
    expect(
      screen.getByRole("spinbutton", { name: "Your vote" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save vote" })).toBeDisabled();
    expect(setCompetitionVote).not.toHaveBeenCalled();
  }
);
it("keeps zero-credit voting bounded in both modes", async () => {
  jest.mocked(fetchCompetitionCredits).mockResolvedValue({
    ...initialBudget,
    available: 0,
    remaining: 0,
    min_vote: 0,
    max_vote: 0,
  });
  mount(null);
  await screen.findAllByRole("slider");
  fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
  const input = screen.getByRole("spinbutton", { name: "Your vote" });
  expect(input).toHaveAttribute("min", "0");
  expect(input).toHaveAttribute("max", "0");
  fireEvent.change(input, { target: { value: "1" } });
  expect(screen.getByRole("button", { name: "Save vote" })).toBeDisabled();
  expect(setCompetitionVote).not.toHaveBeenCalled();
});
