import { render, fireEvent, act } from "@testing-library/react";
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
      onClick={() => props.onReply()}
    />
  ),
}));

const drop = { id: "drop", type: DropSize.FULL } as any;

const isMobileMock = useIsMobileDevice as jest.Mock;
const isTouchDeviceMock = useIsTouchDevice as jest.Mock;

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

beforeEach(() => {
  isMobileMock.mockReturnValue(false);
  isTouchDeviceMock.mockReturnValue(true);
  setViewportWidth(390);
});

afterEach(() => {
  jest.useRealTimers();
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
  fireEvent.click(menu);
  expect(menu.dataset.open).toBe("false");
});

test("does not open menu on desktop-width touch devices", () => {
  jest.useFakeTimers();
  setViewportWidth(1440);

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
});
