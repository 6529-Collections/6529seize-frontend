jest.unmock("lexical");

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { E2eeConversationView } from "@/components/e2ee/conversation/E2eeConversationView";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import {
  contextFor,
  conversation,
  createFakeE2eeEngine,
  E2eeTestProvider,
  message,
} from "./fakeE2eeEngine";

const mockPush = jest.fn();
let mockIsCapacitor = false;

jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted/0x",
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isCapacitor: mockIsCapacitor,
    isIos: false,
    isAndroid: false,
  }),
}));
jest.mock("@/components/e2ee/gate/E2eeRenewalBanner", () => ({
  E2eeRenewalBanner: () => null,
}));

const touch = (clientX: number, clientY = 100) => ({
  identifier: 13,
  clientX,
  clientY,
});

function renderConversation() {
  const chat = conversation();
  const engine = createFakeE2eeEngine({
    conversations: [chat],
    messages: {
      [chat.g]: [message({ id: "existing", text: "Existing message" })],
    },
  });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeConversationView g={chat.g} />
    </E2eeTestProvider>
  );
  const surface = screen.getByRole("region", {
    name: "Encrypted chat file upload area",
  });
  jest.spyOn(surface, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 390,
    bottom: 760,
    width: 390,
    height: 760,
    toJSON: () => ({}),
  });
  return surface;
}

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

describe("encrypted conversation swipe back", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockIsCapacitor = true;
    Element.prototype.scrollTo = jest.fn();
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it("tracks a native content swipe and returns to the same list as Back", () => {
    const surface = renderConversation();
    fireEvent.touchStart(surface, { touches: [touch(80)] });
    move(surface, 200);
    expect(surface.style.transform).toBe("translate3d(120px, 0, 0)");
    expect(mockPush).not.toHaveBeenCalled();

    release(surface, 200);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(getEncryptedMessagesRoute(), {
      scroll: false,
    });
    expect(surface.style.transform).toBe("");
    expect(
      screen.getByRole("link", { name: "Back to encrypted messages" })
    ).toHaveAttribute("href", getEncryptedMessagesRoute());
  });

  it("cancels reversal and vertical intent, leaving the conversation open", () => {
    const surface = renderConversation();
    fireEvent.touchStart(surface, { touches: [touch(80)] });
    move(surface, 210);
    move(surface, 95);
    release(surface, 95);

    fireEvent.touchStart(surface, { touches: [touch(80)] });
    move(surface, 95, 180);
    move(surface, 220, 190);
    release(surface, 220, 190);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("preserves web touch and desktop mouse navigation", () => {
    mockIsCapacitor = false;
    const surface = renderConversation();
    fireEvent.touchStart(surface, { touches: [touch(80)] });
    move(surface, 220);
    release(surface, 220);
    fireEvent.mouseDown(surface, { clientX: 80 });
    fireEvent.mouseMove(surface, { clientX: 220 });
    fireEvent.mouseUp(surface, { clientX: 220 });
    expect(mockPush).not.toHaveBeenCalled();
    expect(surface.style.transform).toBe("");
  });
});
