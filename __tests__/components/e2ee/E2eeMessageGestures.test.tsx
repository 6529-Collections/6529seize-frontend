import { Profiler } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  E2eeMessageItem,
  type E2eeMessageActions,
} from "@/components/e2ee/conversation/E2eeMessageItem";
import type { E2eeMessage } from "@/lib/e2ee/types";
import {
  conversation,
  createFakeE2eeEngine,
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

const touch = (clientX: number, clientY = 100) => ({
  identifier: 7,
  clientX,
  clientY,
});

function move(target: Element, clientX: number, clientY = 100) {
  fireEvent.touchMove(target, { touches: [touch(clientX, clientY)] });
  act(() => jest.advanceTimersByTime(20));
}

function release(target: Element, clientX: number, clientY = 100) {
  fireEvent.touchEnd(target, {
    touches: [],
    changedTouches: [touch(clientX, clientY)],
  });
}

function renderItem({
  item = message({ id: "swipe-message", text: "A message to reply to" }),
  canAct = true,
  selfProfileId = SELF_ID,
  onRender = jest.fn(),
}: {
  readonly item?: E2eeMessage;
  readonly canAct?: boolean;
  readonly selfProfileId?: string | null;
  readonly onRender?: jest.Mock;
} = {}) {
  const view = render(
    <Profiler id="message" onRender={onRender}>
      <ul>
        <E2eeMessageItem
          message={item}
          conversation={conversation()}
          engine={createFakeE2eeEngine()}
          selfProfileId={selfProfileId}
          replyTarget={null}
          compact={false}
          canAct={canAct}
          actions={actions}
        />
      </ul>
    </Profiler>
  );
  const row = screen.getByRole("listitem");
  const target = row.querySelector("time") ?? row;
  return { ...view, item, target, onRender };
}

describe("encrypted message touch gestures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it("tracks the finger and starts the existing reply only on release", () => {
    const { item, target } = renderItem();
    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 120);
    const surface = target.closest("[data-reply-swiping]");
    expect(surface).toHaveAttribute("data-reply-ready", "true");
    expect(surface?.getAttribute("style")).toContain(
      "--message-swipe-transform: translate3d(-120px, 0, 0)"
    );
    expect(actions.onReply).not.toHaveBeenCalled();
    expect(target).toHaveAttribute("dateTime", new Date(item.ts).toISOString());

    release(target, 120);
    expect(actions.onReply).toHaveBeenCalledTimes(1);
    expect(actions.onReply).toHaveBeenCalledWith(item);
    expect(surface).not.toHaveAttribute("data-reply-swiping");
    expect(target).toHaveAttribute("dateTime", new Date(item.ts).toISOString());
    expect(
      screen.getByRole("button", { name: "Message actions" })
    ).toBeVisible();
  });

  it("performs no React render while touch frames move the message", async () => {
    const { target, onRender } = renderItem();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 220);
    // The first touch can update Headless UI's input modality. Once that
    // settles, frame updates must remain outside React.
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    const rendersBeforeSwipe = onRender.mock.calls.length;
    for (let offset = 25; offset <= 125; offset += 5) {
      move(target, 240 - offset);
    }
    expect(onRender).toHaveBeenCalledTimes(rendersBeforeSwipe);
    fireEvent.touchCancel(target);
  });

  it("cancels a reply when the finger reverses below the threshold", () => {
    const { target } = renderItem();
    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 120);
    move(target, 210);
    release(target, 210);
    expect(actions.onReply).not.toHaveBeenCalled();
  });

  it("leaves vertical scrolling and multi-touch without a reply", () => {
    const { target } = renderItem();
    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 220, 180);
    move(target, 100, 190);
    release(target, 100, 190);
    expect(actions.onReply).not.toHaveBeenCalled();

    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 120);
    fireEvent.touchStart(target, {
      touches: [touch(120), { ...touch(150), identifier: 8 }],
    });
    release(target, 120);
    expect(actions.onReply).not.toHaveBeenCalled();
  });

  it("preserves link interaction and mouse drags", () => {
    const { target } = renderItem({
      item: message({ id: "linked", text: "https://6529.io/the-memes" }),
    });
    const link = screen.getByRole("link", {
      name: "https://6529.io/the-memes",
    });
    fireEvent.touchStart(link, { touches: [touch(240)] });
    move(link, 110);
    release(link, 110);

    fireEvent.mouseDown(target, { clientX: 240 });
    fireEvent.mouseMove(target, { clientX: 110 });
    fireEvent.mouseUp(target, { clientX: 110 });
    expect(actions.onReply).not.toHaveBeenCalled();
    expect(target.closest("[data-reply-swiping]")).toBeNull();
    expect(link).toHaveAttribute("href", "https://6529.io/the-memes");
  });

  it.each([
    { name: "read-only chat", canAct: false },
    { name: "missing profile", selfProfileId: null },
    {
      name: "pending message",
      item: message({ id: "pending", pending: true }),
    },
    {
      name: "deleted message",
      item: message({ id: "deleted", deleted: true }),
    },
    {
      name: "undecryptable message",
      item: message({ id: "unreadable", undecryptable: true }),
    },
    {
      name: "unsent message",
      item: message({ id: "unsent", unsent: "suite_upgrade" }),
    },
    {
      name: "notice",
      item: message({
        id: "notice",
        kind: "notice",
        notice: {
          type: "joined",
          actorProfileId: SELF_ID,
          targetProfileIds: [],
        },
      }),
    },
  ])("does not offer swipe reply for $name", ({ name: _name, ...options }) => {
    const { target } = renderItem(options);
    fireEvent.touchStart(target, { touches: [touch(240)] });
    move(target, 110);
    release(target, 110);
    expect(actions.onReply).not.toHaveBeenCalled();
    expect(target.closest("[data-reply-swiping]")).toBeNull();
  });
});
