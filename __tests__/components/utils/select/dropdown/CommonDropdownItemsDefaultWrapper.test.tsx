import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock("react-use", () => ({
  useClickAway: (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    React.useEffect(() => {
      const listener = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) handler();
      };
      document.addEventListener("mousedown", listener);
      return () => document.removeEventListener("mousedown", listener);
    }, [ref, handler]);
  },
  useKeyPressEvent: (key: string, cb: () => void) => {
    React.useEffect(() => {
      const handler = (e: KeyboardEvent) => e.key === key && cb();
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [key, cb]);
  },
}));

const createRect = ({
  top,
  bottom,
  left,
  right,
}: {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}) => ({
  top,
  bottom,
  left,
  right,
  width: right - left,
  height: bottom - top,
  x: left,
  y: top,
  toJSON: () => ({}),
});

const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

afterEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalInnerWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: originalInnerHeight,
  });
  jest.restoreAllMocks();
});

test("closes on escape press", () => {
  const setOpen = jest.fn();
  render(
    <CommonDropdownItemsDefaultWrapper
      isOpen={true}
      setOpen={setOpen}
      buttonRef={{ current: null }}
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(setOpen).toHaveBeenCalledWith(false);
});

test("positions the dropdown below the trigger when there is space", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 720,
  });
  jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(160);
  jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(120);

  const button = document.createElement("button");
  Object.defineProperty(button, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      createRect({
        top: 200,
        bottom: 232,
        left: 100,
        right: 132,
      }),
  });

  render(
    <CommonDropdownItemsDefaultWrapper
      isOpen={true}
      setOpen={() => {}}
      buttonRef={{ current: button }}
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );

  await waitFor(() => {
    expect(screen.getByRole("menu").parentElement).toHaveStyle({
      left: "100px",
      top: "240px",
    });
  });
});

test("positions the dropdown above the trigger near the viewport bottom", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 500,
  });
  jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(160);
  jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(120);

  const button = document.createElement("button");
  Object.defineProperty(button, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      createRect({
        top: 440,
        bottom: 472,
        left: 100,
        right: 132,
      }),
  });

  render(
    <CommonDropdownItemsDefaultWrapper
      isOpen={true}
      setOpen={() => {}}
      buttonRef={{ current: button }}
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );

  await waitFor(() => {
    expect(screen.getByRole("menu").parentElement).toHaveStyle({
      left: "100px",
      top: "312px",
    });
  });
});
