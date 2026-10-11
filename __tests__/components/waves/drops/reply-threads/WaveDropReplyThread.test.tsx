import { render, screen } from "@testing-library/react";
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

const mockApplyOptimisticDropUpdate = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    applyOptimisticDropUpdate: mockApplyOptimisticDropUpdate,
  }),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));
jest.mock("@/hooks/useDropMessages", () => ({
  useDropMessages: jest.fn(),
}));

const useDropMessagesMock = useDropMessages as jest.Mock;
const useWebSocketMessageMock = useWebSocketMessage as jest.Mock;

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
}: {
  readonly drop: ExtendedDrop;
  readonly enabled?: boolean;
}) {
  const store = useExpandedReplyThreadsStore();
  return (
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
  );
}

describe("WaveDropReplyThread", () => {
  beforeEach(() => {
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

    const toggle = screen.getByRole("button", { name: "2 replies" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(useDropMessagesMock).not.toHaveBeenCalled();

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Hide replies" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(useDropMessagesMock).toHaveBeenCalledWith("wave-1", "root", wave);
    const group = screen.getByRole("group", { name: "Replies to this drop" });
    expect(group).toHaveTextContent("reply-1 after start");
    expect(group).toHaveTextContent("reply-2 after reply-1");
    expect(group.textContent?.indexOf("reply-1")).toBeLessThan(
      group.textContent?.indexOf("reply-2") ?? -1
    );

    await user.click(screen.getByRole("button", { name: "Hide replies" }));
    expect(
      screen.queryByRole("group", { name: "Replies to this drop" })
    ).not.toBeInTheDocument();
  });

  it("uses singular wording for one reply", () => {
    render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);

    expect(screen.getByRole("button", { name: "1 reply" })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "60 replies" }));
    await user.click(
      screen.getByRole("button", { name: "Show earlier replies" })
    );

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  describe("live reply counts", () => {
    const getDropUpdateHandler = () =>
      useWebSocketMessageMock.mock.calls.at(-1)?.[1] as (
        drop: Record<string, unknown>
      ) => void;

    const newReply = (overrides: Record<string, unknown> = {}) => ({
      id: "new-reply",
      wave: { id: "wave-1" },
      reply_to: { drop_id: "root", drop_part_id: 1 },
      created_at: Date.now() + 1000,
      updated_at: null,
      ...overrides,
    });

    it("bumps the parent count once per new reply", () => {
      render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
      const handle = getDropUpdateHandler();

      handle(newReply());
      handle(newReply());

      expect(mockApplyOptimisticDropUpdate).toHaveBeenCalledTimes(1);
      const { waveId, dropId, update } =
        mockApplyOptimisticDropUpdate.mock.calls[0][0];
      expect({ waveId, dropId }).toEqual({ waveId: "wave-1", dropId: "root" });
      expect(update(makeDrop("root", 10, { replies_count: 1 }))).toMatchObject({
        replies_count: 2,
      });
    });

    it("ignores edits, older replies, other waves and top-level drops", () => {
      render(<Harness drop={makeDrop("root", 10, { replies_count: 1 })} />);
      const handle = getDropUpdateHandler();

      handle(newReply({ updated_at: Date.now() }));
      handle(newReply({ id: "old", created_at: 0 }));
      handle(newReply({ id: "other-wave", wave: { id: "wave-2" } }));
      handle(newReply({ id: "top-level", reply_to: undefined }));

      expect(mockApplyOptimisticDropUpdate).not.toHaveBeenCalled();
    });
  });
});
