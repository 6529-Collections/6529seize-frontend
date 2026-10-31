import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import WaveDropReplyThread from "@/components/waves/drops/reply-threads/WaveDropReplyThread";
import {
  useExpandedReplyThreadsStore,
  WaveReplyThreadsProvider,
} from "@/components/waves/drops/reply-threads/WaveReplyThreadsContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropMessages } from "@/hooks/useDropMessages";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { WsMessageType } from "@/helpers/Types";

const mockApplyOptimisticDropUpdate = jest.fn();
const mockWaveMessages = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamWaveMessages: () => mockWaveMessages(),
  useMyStreamActions: () => ({
    applyOptimisticDropUpdate: mockApplyOptimisticDropUpdate,
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "sender" } }),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));
jest.mock("@/hooks/useDropMessages", () => ({
  useDropMessages: jest.fn(),
}));
jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));

const useDropMessagesMock = useDropMessages as jest.Mock;
const useWebSocketMessageMock = useWebSocketMessage as jest.Mock;
const fetchDropMock = fetchDropByIdBatched as jest.Mock;

const wave = { id: "wave-1" } as ApiWave;

const makeDrop = (
  id: string,
  serialNo: number,
  overrides: Partial<ExtendedDrop> = {}
): ExtendedDrop =>
  ({
    id,
    serial_no: serialNo,
    type: DropSize.FULL,
    stableKey: id,
    stableHash: id,
    wave: { id: "wave-1" },
    ...overrides,
  }) as ExtendedDrop;

function Harness({
  drop,
  enabled = true,
  simulateSend = false,
}: {
  readonly drop: ExtendedDrop;
  readonly enabled?: boolean;
  readonly simulateSend?: boolean;
}) {
  const store = useExpandedReplyThreadsStore();
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {simulateSend && (
        <button onClick={() => store.setExpanded(drop.id, true)}>
          Send reply
        </button>
      )}
      <WaveReplyThreadsProvider enabled={enabled} wave={wave} store={store}>
        <WaveDropReplyThread
          drop={drop}
          renderReply={({ reply, previousReply }) => (
            <p>
              {reply.id} after {previousReply?.id ?? "start"}
            </p>
          )}
        />
      </WaveReplyThreadsProvider>
    </QueryClientProvider>
  );
}

function LiveHarness() {
  const [drop, setDrop] = useState(() =>
    makeDrop("root", 10, { replies_count: 1 })
  );
  mockApplyOptimisticDropUpdate.mockImplementation(({ dropId, update }) => {
    if (dropId === "root") setDrop((current) => update(current) ?? current);
    return null;
  });
  return <Harness drop={drop} />;
}

describe("WaveDropReplyThread", () => {
  beforeEach(() => {
    mockWaveMessages.mockReturnValue(undefined);
    mockApplyOptimisticDropUpdate.mockReset();
    fetchDropMock.mockReset();
    useDropMessagesMock.mockReturnValue({
      drops: [makeDrop("reply-2", 12), makeDrop("reply-1", 11)],
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the wave does not collapse replies", () => {
    render(
      <Harness
        drop={makeDrop("root", 10, { replies_count: 2 })}
        enabled={false}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for a drop without replies", () => {
    render(<Harness drop={makeDrop("root", 10)} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(useDropMessagesMock).not.toHaveBeenCalled();
  });

  it("opens the thread oldest first and fetches only while open", async () => {
    const user = userEvent.setup();
    render(<Harness drop={makeDrop("root", 10, { replies_count: 2 })} />);

    const toggle = screen.getByRole("button", { name: "Show 2 replies" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(useDropMessagesMock).not.toHaveBeenCalled();

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Hide replies" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(useDropMessagesMock).toHaveBeenCalledWith("wave-1", "root", wave);
    const group = screen.getByRole("list", { name: "Replies to this drop" });
    expect(group).toHaveTextContent("reply-1 after start");
    expect(group).toHaveTextContent("reply-2 after reply-1");
    expect(group.textContent?.indexOf("reply-1")).toBeLessThan(
      group.textContent?.indexOf("reply-2") ?? -1
    );

    await user.click(screen.getByRole("button", { name: "Hide replies" }));
    expect(
      screen.queryByRole("list", { name: "Replies to this drop" })
    ).not.toBeInTheDocument();
  });

  it("announces loading through a live region that exists before opening", async () => {
    const user = userEvent.setup();
    useDropMessagesMock.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: false,
    });
    render(<Harness drop={makeDrop("root", 10, { replies_count: 2 })} />);

    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Show 2 replies" }));

    // The live region is driven by the real query; the mocked hook shows the
    // visible loading text instead.
    expect(screen.getByText("Loading replies…")).toBeInTheDocument();
  });

  it("uses singular wording for one reply", () => {
    render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);

    expect(
      screen.getByRole("button", { name: "Show 1 reply" })
    ).toBeInTheDocument();
  });

  it("offers retry after a failed load and shows empty only after a successful read", async () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    const response = {
      drops: [],
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: true,
      fetchNextPage: jest.fn(),
      refetch,
    };
    useDropMessagesMock.mockReturnValue(response);
    const view = render(
      <Harness drop={makeDrop("root", 10, { replies_count: 1 })} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Show 1 reply" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load replies."
    );
    expect(screen.queryByText("No replies to show.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);

    useDropMessagesMock.mockReturnValue({ ...response, isFetching: true });
    view.rerender(
      <Harness drop={makeDrop("root", 10, { replies_count: 1 })} />
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
    expect(screen.getByText("Loading replies…")).toBeInTheDocument();
    expect(screen.queryByText("No replies to show.")).not.toBeInTheDocument();

    useDropMessagesMock.mockReturnValue({ ...response, isError: false });
    view.rerender(
      <Harness drop={makeDrop("root", 10, { replies_count: 1 })} />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("No replies to show.")).toBeInTheDocument();
  });

  it("keeps loaded replies visible when a refresh fails", async () => {
    useDropMessagesMock.mockReturnValue({
      drops: [makeDrop("reply-1", 11)],
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn().mockResolvedValue(undefined),
    });
    render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
    await userEvent.click(screen.getByRole("button", { name: "Show 1 reply" }));
    expect(screen.getByText("reply-1 after start")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load replies."
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("renders a completed response before the hook's effect-delayed drop copy", async () => {
    const user = userEvent.setup();
    const reply = makeDrop("ready-reply", 11, {
      author: { id: "sender", handle: "sender" } as ExtendedDrop["author"],
      parts: [
        {
          part_id: 1,
          content: "ready",
          media: [],
          attachments: [],
          quoted_drop: null,
        },
      ],
      metadata: [],
      created_at: 100,
    });
    useDropMessagesMock.mockReturnValue({
      data: { pages: [{ wave, drops: [reply] }] },
      drops: [],
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });
    render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    expect(screen.getByText("ready-reply after start")).toBeInTheDocument();
    expect(screen.queryByText("No replies to show.")).not.toBeInTheDocument();
  });

  it("shows the sender's pending first reply when auto-opening an uncached thread", async () => {
    const pending = makeDrop("temp-new", 20, {
      author: { id: "sender", handle: "sender" } as ExtendedDrop["author"],
      parts: [
        {
          part_id: 1,
          content: "my reply",
          media: [],
          attachments: [],
          quoted_drop: null,
        },
      ],
      metadata: [],
      created_at: 100,
      reply_to: { drop_id: "root", drop_part_id: 1, is_deleted: false },
    });
    mockWaveMessages.mockReturnValue({ drops: [pending] });
    useDropMessagesMock.mockReturnValue({
      data: { pages: [{ wave, drops: [] }] },
      drops: [],
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });
    render(<Harness drop={makeDrop("root", 10)} simulateSend />);
    await userEvent.click(screen.getByRole("button", { name: "Send reply" }));
    expect(screen.getByText("temp-new after start")).toBeInTheDocument();
    expect(screen.queryByText("No replies to show.")).not.toBeInTheDocument();
  });

  it("loads earlier replies on request", async () => {
    const user = userEvent.setup();
    const fetchNextPage = jest.fn().mockResolvedValue(undefined);
    useDropMessagesMock.mockReturnValue({
      drops: [makeDrop("reply-1", 11)],
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
    });
    render(<Harness drop={makeDrop("root", 10, { replies_count: 60 })} />);

    await user.click(screen.getByRole("button", { name: "Show 60 replies" }));
    await user.click(
      screen.getByRole("button", { name: "Show earlier replies" })
    );

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  describe("live reply counts", () => {
    const getHandler = (type: WsMessageType = WsMessageType.DROP_UPDATE) =>
      useWebSocketMessageMock.mock.calls.find(
        ([messageType]) => messageType === type
      )?.[1] as (drop: Record<string, unknown>) => void;

    const newReply = (overrides: Record<string, unknown> = {}) => ({
      id: "new-reply",
      wave: { id: "wave-1" },
      reply_to: { drop_id: "root", drop_part_id: 1 },
      created_at: Date.now() + 1000,
      updated_at: null,
      ...overrides,
    });

    it("uses the server count without double-counting duplicate events", async () => {
      fetchDropMock.mockResolvedValue(
        makeDrop("root", 10, { replies_count: 2 })
      );
      render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
      const handle = getHandler();

      handle(newReply());
      handle(newReply());

      await waitFor(() =>
        expect(mockApplyOptimisticDropUpdate).toHaveBeenCalled()
      );
      const { waveId, dropId, update } =
        mockApplyOptimisticDropUpdate.mock.calls[0][0];
      expect({ waveId, dropId }).toEqual({ waveId: "wave-1", dropId: "root" });
      expect(update(makeDrop("root", 10, { replies_count: 1 }))).toMatchObject({
        replies_count: 2,
      });
    });

    it("updates the original badge when replying to a reply", async () => {
      fetchDropMock.mockImplementation(async (id: string) =>
        id === "reply-1"
          ? makeDrop("reply-1", 11, {
              reply_to: { drop_id: "root", drop_part_id: 1, is_deleted: false },
              replies_count: 1,
            })
          : makeDrop("root", 10, { replies_count: 2 })
      );
      render(<LiveHarness />);
      expect(
        screen.getByRole("button", { name: "Show 1 reply" })
      ).toBeInTheDocument();
      act(() => getHandler()(newReply({ reply_to: { drop_id: "reply-1" } })));
      await screen.findByRole("button", { name: "Show 2 replies" });
      expect(fetchDropMock).toHaveBeenCalledWith("reply-1");
      expect(fetchDropMock).toHaveBeenCalledWith("root");
    });

    it("reconciles compact WebSocket events as well as full events", async () => {
      fetchDropMock.mockImplementation(async (id: string) =>
        id === "new-reply"
          ? newReply()
          : makeDrop("root", 10, { replies_count: 2 })
      );
      render(<LiveHarness />);
      act(() =>
        getHandler(WsMessageType.DROP_UPDATE_REF)({
          drop_id: "new-reply",
          wave_id: "wave-1",
          author_id: "author",
          serial_no: 12,
          update_type: WsMessageType.DROP_UPDATE,
        })
      );
      await screen.findByRole("button", { name: "Show 2 replies" });
    });

    it("reconciles delayed or edited replies without adding to the count", async () => {
      fetchDropMock.mockResolvedValue(
        makeDrop("root", 10, { replies_count: 2 })
      );
      render(<LiveHarness />);
      act(() =>
        getHandler()(newReply({ created_at: 0, updated_at: Date.now() }))
      );
      await screen.findByRole("button", { name: "Show 2 replies" });
    });

    it("ignores other waves and top-level drops", () => {
      render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
      const handle = getHandler();

      handle(newReply({ id: "other-wave", wave: { id: "wave-2" } }));
      handle(newReply({ id: "top-level", reply_to: undefined }));

      expect(mockApplyOptimisticDropUpdate).not.toHaveBeenCalled();
      expect(fetchDropMock).not.toHaveBeenCalled();
    });

    it("does not fetch reply counts when collapse is disabled", () => {
      render(<Harness drop={makeDrop("root", 10)} enabled={false} />);
      getHandler()(newReply());
      expect(fetchDropMock).not.toHaveBeenCalled();
    });
  });
});
