import WaveDropPoll from "@/components/waves/drops/poll/WaveDropPoll";
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

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactElement }) => (
    <>{children}</>
  ),
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
  closing_time: Date.now() + 60_000,
  is_open: true,
  ...overrides,
});

const createDrop = (poll: ApiDropPoll): ApiDrop =>
  ({
    id: "drop-1",
    wave: {
      id: "wave-1",
      name: "Wave 1",
    },
    poll,
  }) as unknown as ApiDrop;

const renderPoll = (poll: ApiDropPoll) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <WaveDropPoll drop={createDrop(poll)} />
    </QueryClientProvider>
  );

  return {
    ...renderResult,
    rerenderPoll: (nextPoll: ApiDropPoll) =>
      renderResult.rerender(
        <QueryClientProvider client={queryClient}>
          <WaveDropPoll drop={createDrop(nextPoll)} />
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
    expect(screen.getByRole("button", { name: "Results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit vote" })).toBeDisabled();
  });

  it("shows results before voting and expands voters for an option", async () => {
    fetchDropPollOptionVotersV2Mock.mockResolvedValueOnce({
      data: [
        {
          id: "identity-1",
          handle: "alice",
          primary_address: "0x0000000000000000000000000000000000000001",
          level: 1,
          classification: ApiProfileClassification.Pseudonym,
          badges: {},
        },
      ],
      count: 1,
      page: 1,
      next: false,
    });

    renderPoll(createPoll());

    await userEvent.click(screen.getByRole("button", { name: "Results" }));
    await userEvent.click(screen.getByRole("button", { name: /First/ }));

    expect(fetchDropPollOptionVotersV2Mock).toHaveBeenCalledWith({
      dropId: "drop-1",
      optionNo: 1,
      page: 1,
      pageSize: 20,
    });
    expect(await screen.findByText("alice")).toBeInTheDocument();
  });

  it("submits a vote and switches to results", async () => {
    const poll = createPoll();
    const updatedPoll = createPoll({ voted: [2] });
    voteDropPollV2Mock.mockResolvedValueOnce(createDrop(updatedPoll));

    renderPoll(poll);

    await userEvent.click(screen.getByLabelText("Second"));
    await userEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() => {
      expect(voteDropPollV2Mock).toHaveBeenCalledWith({
        drop: createDrop(poll),
        options: [2],
      });
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
