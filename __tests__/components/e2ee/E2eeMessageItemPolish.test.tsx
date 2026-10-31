import { act, render, screen } from "@testing-library/react";
import {
  E2eeMessageItem,
  type E2eeMessageActions,
} from "@/components/e2ee/conversation/E2eeMessageItem";
import {
  conversation,
  createFakeE2eeEngine,
  DM_G,
  member,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

const actions: E2eeMessageActions = {
  onReply: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onBlock: jest.fn(),
  onToggleMute: jest.fn(),
  muted: false,
  onReact: jest.fn(),
  onJumpTo: jest.fn(),
};

const renderItem = (item: ReturnType<typeof message>, chat = conversation()) =>
  render(
    <ul>
      <E2eeMessageItem
        message={item}
        conversation={chat}
        engine={createFakeE2eeEngine()}
        selfProfileId={SELF_ID}
        replyTarget={null}
        compact={false}
        canAct
        actions={actions}
      />
    </ul>
  );

describe("E2eeMessageItem polish", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("says it is waiting for a connection after 10 s, and resets on a new send", () => {
    jest.useFakeTimers();
    const sentAt = Date.now();
    const pending = message({
      id: "m1",
      senderProfileId: SELF_ID,
      pending: true,
      ts: sentAt,
      text: "On my way",
    });
    const { rerender } = renderItem(pending);
    expect(screen.getByText("Sending…")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(
      screen.getByText("Waiting for connection. Will keep trying.")
    ).toBeInTheDocument();

    rerender(
      <ul>
        <E2eeMessageItem
          message={{ ...pending, ts: Date.now() }}
          conversation={conversation()}
          engine={createFakeE2eeEngine()}
          selfProfileId={SELF_ID}
          replyTarget={null}
          compact={false}
          canAct
          actions={actions}
        />
      </ul>
    );
    expect(screen.getByText("Sending…")).toBeInTheDocument();
  });

  it("clears the slow-send note after sending and on a new send with the same id", () => {
    jest.useFakeTimers();
    const first = message({
      id: "m9",
      senderProfileId: SELF_ID,
      pending: true,
      ts: Date.now(),
      text: "Retry me",
    });
    const view = (item: ReturnType<typeof message>) => (
      <ul>
        <E2eeMessageItem
          message={item}
          conversation={conversation()}
          engine={createFakeE2eeEngine()}
          selfProfileId={SELF_ID}
          replyTarget={null}
          compact={false}
          canAct
          actions={actions}
        />
      </ul>
    );
    const { rerender } = render(view(first));
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(
      screen.getByText("Waiting for connection. Will keep trying.")
    ).toBeInTheDocument();

    rerender(view({ ...first, pending: false, seq: 4 }));
    expect(screen.queryByText(/Waiting for connection/u)).toBeNull();
    expect(screen.queryByText("Sending…")).toBeNull();

    rerender(view({ ...first, pending: true, seq: 0, ts: Date.now() }));
    expect(screen.getByText("Sending…")).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for connection/u)).toBeNull();
  });

  it("links http(s) URLs safely and leaves other text alone", () => {
    renderItem(
      message({ id: "m2", text: "Card: https://6529.io/the-memes/400." })
    );
    const link = screen.getByRole("link", {
      name: "https://6529.io/the-memes/400",
    });
    expect(link).toHaveAttribute("href", "https://6529.io/the-memes/400");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("names the other person on an undecryptable message in a DM", () => {
    renderItem(
      message({
        id: "m3",
        g: DM_G,
        senderProfileId: null,
        undecryptable: true,
      }),
      conversation({
        g: DM_G,
        kind: "dm",
        name: null,
        members: [member(SELF_ID, "me"), member("profile-bob", "bob")],
      })
    );
    expect(screen.getByText("Couldn’t decrypt this message")).toBeVisible();
    expect(
      screen.getByText(
        "It couldn’t be read on this device. Ask bob to send it again if you need it."
      )
    ).toBeVisible();
  });
});
