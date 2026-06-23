import WaveDropPoll from "@/components/waves/drops/poll/WaveDropPoll";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import {
  fetchDropPollOptionVotersV2,
  voteDropPollV2,
} from "@/services/api/wave-drops-v2-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

const mockRequestAuth = jest.fn();
const mockSetToast = jest.fn();
const mockProcessIncomingDrop = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestAuth: mockRequestAuth,
    setToast: mockSetToast,
  }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({
    processIncomingDrop: mockProcessIncomingDrop,
  }),
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({
    getEligibility: () => null,
  }),
}));

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactElement }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  voteDropPollV2: jest.fn(),
  fetchDropPollOptionVotersV2: jest.fn(),
}));

const voteDropPollV2Mock = voteDropPollV2 as jest.MockedFunction<
  typeof voteDropPollV2
>;
const fetchDropPollOptionVotersV2Mock =
  fetchDropPollOptionVotersV2 as jest.MockedFunction<
    typeof fetchDropPollOptionVotersV2
  >;

const createPoll = (overrides: Partial<ApiDropPoll> = {}): ApiDropPoll => ({
  id: "poll-1",
  options: [
    {
      option_no: 1,
      option_string: "First",
      votes: 2,
    },
    {
      option_no: 2,
      option_string: "Second",
      votes: 1,
    },
  ],
  voted: [],
  multichoice: false,
  anonymous: false,
  only_droppers_can_respond: false,
  closing_time: Date.now() + 60_000,
  is_open: true,
  ...overrides,
});

interface CreateDropOptions {
  readonly canChat?: boolean;
}

const createDrop = (
  poll: ApiDropPoll,
  { canChat = true }: CreateDropOptions = {}
): ApiDrop =>
  ({
    id: "drop-1",
    wave: {
      id: "wave-1",
      name: "Wave 1",
      authenticated_user_eligible_to_chat: canChat,
    },
    poll,
  }) as unknown as ApiDrop;

const renderPoll = (poll: ApiDropPoll, options: CreateDropOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <WaveDropPoll drop={createDrop(poll, options)} />
    </QueryClientProvider>
  );

  return {
    ...renderResult,
    queryClient,
    rerenderPoll: (nextPoll: ApiDropPoll) =>
      renderResult.rerender(
        <QueryClientProvider client={queryClient}>
          <WaveDropPoll drop={createDrop(nextPoll, options)} />
        </QueryClientProvider>
      ),
  };
};

describe("WaveDropPoll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAuth.mockResolvedValue({ success: true });
    fetchDropPollOptionVotersV2Mock.mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      next: false,
    });
  });

  it("defaults to voting view when the user has not voted", () => {
    renderPoll(createPoll());

    expect(screen.getByLabelText("First")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Results" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Submit vote" })).toBeNull();
  });

  it("keeps unrestricted polls voteable when the viewer cannot chat", () => {
    renderPoll(createPoll(), { canChat: false });

    expect(screen.getByRole("radio", { name: "First" })).toBeInTheDocument();
    expect(screen.queryByText("2 votes")).not.toBeInTheDocument();
  });

  it("shows results only for restricted polls when the viewer cannot chat", () => {
    renderPoll(
      createPoll({
        only_droppers_can_respond: true,
      }),
      { canChat: false }
    );

    expect(
      screen.queryByRole("radio", { name: "First" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View voters for First/ })
    ).toBeInTheDocument();
    expect(voteDropPollV2Mock).not.toHaveBeenCalled();
  });

  it("does not show change vote for restricted polls when the viewer cannot chat", () => {
    renderPoll(
      createPoll({
        only_droppers_can_respond: true,
        voted: [1],
      }),
      { canChat: false }
    );

    expect(
      screen.queryByRole("button", { name: "Change vote" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Voted")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View voters for First.*Your vote/ })
    ).toBeInTheDocument();
  });

  it("shows results without fetching voters until an option expands", async () => {
    fetchDropPollOptionVotersV2Mock.mockResolvedValue({
      data: [
        {
          id: "identity-1",
          handle: "alice",
          primary_address: "0x0000000000000000000000000000000000000001",
          level: 1,
          classification: ApiProfileClassification.Pseudonym,
          badges: {},
          pfp: "https://example.com/alice.png",
        },
      ],
      count: 1,
      page: 1,
      next: false,
    });

    renderPoll(
      createPoll({
        is_open: false,
        closing_time: Date.now() - 60_000,
      })
    );

    const firstOption = screen.getByRole("button", {
      name: /View voters for First/,
    });

    expect(screen.getByText("2 votes")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("1 vote")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(fetchDropPollOptionVotersV2Mock).not.toHaveBeenCalled();

    await userEvent.hover(firstOption);
    firstOption.focus();

    expect(fetchDropPollOptionVotersV2Mock).not.toHaveBeenCalled();

    await userEvent.click(firstOption);

    expect(fetchDropPollOptionVotersV2Mock).toHaveBeenCalledTimes(1);
    expect(fetchDropPollOptionVotersV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "drop-1",
        optionNo: 1,
        page: 1,
        pageSize: 20,
      })
    );
    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(await screen.findByAltText("alice's avatar")).toBeInTheDocument();
  });

  it("does not expose voter expansion for anonymous polls", () => {
    renderPoll(
      createPoll({
        anonymous: true,
        is_open: false,
        closing_time: Date.now() - 60_000,
      })
    );

    expect(screen.getByText("2 votes")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /View voters for First/ })
    ).not.toBeInTheDocument();
    expect(fetchDropPollOptionVotersV2Mock).not.toHaveBeenCalled();
  });

  it("submits a vote and switches to results", async () => {
    const poll = createPoll();
    const updatedPoll = createPoll({ voted: [2] });
    voteDropPollV2Mock.mockResolvedValueOnce(createDrop(updatedPoll));

    const { queryClient } = renderPoll(poll);
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByLabelText("Second"));

    await waitFor(() => {
      expect(voteDropPollV2Mock).toHaveBeenCalledWith({
        drop: createDrop(poll),
        options: [2],
      });
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_POLLS],
    });
    expect(
      await screen.findByRole("button", { name: "Change vote" })
    ).toBeInTheDocument();
    expect(mockProcessIncomingDrop).toHaveBeenCalled();
  });

  it("keeps the user's selected option when a websocket poll update has a stale vote", async () => {
    const poll = createPoll();
    const updatedPoll = createPoll({ voted: [2] });
    const websocketPoll = createPoll({
      options: [
        {
          option_no: 1,
          option_string: "First",
          votes: 3,
        },
        {
          option_no: 2,
          option_string: "Second",
          votes: 2,
        },
      ],
      voted: [1],
    });
    voteDropPollV2Mock.mockResolvedValueOnce(createDrop(updatedPoll));

    const { rerenderPoll } = renderPoll(poll);

    await userEvent.click(screen.getByLabelText("Second"));

    expect(
      await screen.findByRole("button", { name: "Change vote" })
    ).toBeInTheDocument();

    rerenderPoll(websocketPoll);

    expect(
      screen.getByRole("button", { name: "Change vote" })
    ).toBeInTheDocument();
    expect(screen.getByText("Voted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /First/ })).not.toHaveClass(
      "tw-border-iron-600"
    );
    expect(screen.getByRole("button", { name: /Second/ })).toHaveClass(
      "tw-border-iron-600"
    );
    expect(
      screen.queryByRole("button", { name: "Submit vote" })
    ).not.toBeInTheDocument();
  });

  it("keeps closed polls in results view only", () => {
    renderPoll(
      createPoll({
        is_open: false,
        closing_time: Date.now() - 60_000,
      })
    );

    expect(screen.queryByLabelText("First")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /First/ })).toBeInTheDocument();
  });
});
