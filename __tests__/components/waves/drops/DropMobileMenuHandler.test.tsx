import { render, fireEvent, act, createEvent } from "@testing-library/react";
import React from "react";
import DropMobileMenuHandler from "@/components/waves/drops/DropMobileMenuHandler";
import { DropSize } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

jest.mock("@/hooks/isMobileDevice");
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      type="button"
      aria-label="menu"
      data-testid="menu"
      data-open={props.isOpen}
      data-long-press-triggered={props.longPressTriggered}
      onClick={() => props.onReply()}
    />
  ),
}));

const drop = { id: "drop", type: DropSize.FULL } as any;
const TOUCH_ACTION_SHEET_SELECT_NONE_CLASS = "touch-action-sheet-select-none";

const isMobileMock = useIsMobileDevice as jest.Mock;
const isTouchDeviceMock = useIsTouchDevice as jest.Mock;
const HOVER_INPUT_MEDIA_QUERIES = new Set([
  "(any-hover: hover)",
  "(hover: hover)",
]);

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

/** Mocks hover media queries used by drop action interaction mode. */
const setHoverSupport = (hasHover: boolean) => {
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => ({
      matches: hasHover && HOVER_INPUT_MEDIA_QUERIES.has(query),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

const getHandlerRoot = (child: HTMLElement) => {
  const root = child.parentElement;
  if (!root) {
    throw new Error("DropMobileMenuHandler root not found");
  }

  return root;
};

beforeEach(() => {
  isMobileMock.mockReturnValue(false);
  isTouchDeviceMock.mockReturnValue(true);
  setViewportWidth(390);
  setHoverSupport(false);
});

afterEach(() => {
  jest.useRealTimers();
});

test("applies selection suppression while touch sheet mode is active", () => {
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );

  expect(getHandlerRoot(getByTestId("child"))).toHaveClass(
    TOUCH_ACTION_SHEET_SELECT_NONE_CLASS
  );
});

test("keeps selection suppression for compact hybrid touch layouts with hover", () => {
  setViewportWidth(800);
  setHoverSupport(true);

  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );

  expect(getHandlerRoot(getByTestId("child"))).toHaveClass(
    TOUCH_ACTION_SHEET_SELECT_NONE_CLASS
  );
});

test("opens menu on long press", () => {
  jest.useFakeTimers();
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );
  fireEvent.touchStart(getByTestId("child"), {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  act(() => {
    jest.advanceTimersByTime(600);
  });
  const menu = getByTestId("menu");
  expect(menu.dataset.open).toBe("true");
  fireEvent.click(getByTestId("child"));
});

test("does not prevent default on short touch start", () => {
  jest.useFakeTimers();
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <button type="button" data-testid="child" />
    </DropMobileMenuHandler>
  );
  const child = getByTestId("child");
  const touchStart = createEvent.touchStart(child, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  const preventDefault = jest.fn();
  Object.defineProperty(touchStart, "preventDefault", {
    configurable: true,
    value: preventDefault,
  });

  fireEvent(child, touchStart);
  fireEvent.touchEnd(child);

  expect(preventDefault).not.toHaveBeenCalled();
});

test("lets short touch taps click child controls", () => {
  jest.useFakeTimers();
  const onChildClick = jest.fn();
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <button type="button" data-testid="child" onClick={onChildClick} />
    </DropMobileMenuHandler>
  );
  const child = getByTestId("child");

  fireEvent.touchStart(child, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  fireEvent.touchEnd(child);
  fireEvent.click(child);

  expect(onChildClick).toHaveBeenCalledTimes(1);
});

test("suppresses the child click after an extended long press opens the menu", () => {
  jest.useFakeTimers();
  const onChildClick = jest.fn();
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <button type="button" data-testid="child" onClick={onChildClick} />
    </DropMobileMenuHandler>
  );
  const child = getByTestId("child");

  fireEvent.touchStart(child, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  act(() => {
    jest.advanceTimersByTime(1300);
  });
  fireEvent.touchEnd(child);
  fireEvent.click(child);

  expect(getByTestId("menu").dataset.open).toBe("true");
  expect(onChildClick).not.toHaveBeenCalled();
});

test("clears an open touch sheet when the layout switches to desktop hover mode", () => {
  jest.useFakeTimers();
  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );

  fireEvent.touchStart(getByTestId("child"), {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  act(() => {
    jest.advanceTimersByTime(600);
  });

  expect(getByTestId("menu").dataset.open).toBe("true");

  setHoverSupport(true);
  act(() => {
    setViewportWidth(1440);
  });

  expect(getByTestId("menu").dataset.open).toBe("false");

  act(() => {
    setViewportWidth(390);
  });

  expect(getByTestId("menu").dataset.open).toBe("false");
});

test("does not open menu on desktop-width touch devices with hover", () => {
  jest.useFakeTimers();
  setViewportWidth(1440);
  setHoverSupport(true);

  const { getByTestId } = render(
    <DropMobileMenuHandler
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    >
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );

  fireEvent.touchStart(getByTestId("child"), {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  act(() => {
    jest.advanceTimersByTime(600);
  });

  expect(getByTestId("menu").dataset.open).toBe("false");
  expect(getByTestId("menu").dataset.longPressTriggered).toBe("false");
  expect(getHandlerRoot(getByTestId("child"))).not.toHaveClass(
    TOUCH_ACTION_SHEET_SELECT_NONE_CLASS
  );
});
