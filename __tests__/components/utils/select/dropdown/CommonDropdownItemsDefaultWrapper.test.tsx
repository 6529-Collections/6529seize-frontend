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

function getPortalWrapper() {
  const wrapper = screen.getByRole("menu").closest(".tw-absolute");
  expect(wrapper).not.toBeNull();
  return wrapper as HTMLElement;
}

afterEach(() => {
  Object.defineProperty(globalThis, "innerWidth", {
    configurable: true,
    value: originalInnerWidth,
  });
  Object.defineProperty(globalThis, "innerHeight", {
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
  Object.defineProperty(globalThis, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(globalThis, "innerHeight", {
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
    const wrapper = getPortalWrapper();
    expect(wrapper.style.left).toBe("100px");
    expect(wrapper.style.top).toBe("240px");
    expect(wrapper.style.width).toBe("224px");
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
    const wrapper = getPortalWrapper();
    expect(wrapper.style.left).toBe("100px");
    expect(wrapper.style.top).toBe("312px");
    expect(wrapper.style.width).toBe("224px");
  });
});

test("uses trigger width when it is wider than the minimum menu width", async () => {
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
        right: 420,
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
    const wrapper = getPortalWrapper();
    expect(wrapper.style.left).toBe("100px");
    expect(wrapper.style.top).toBe("240px");
    expect(wrapper.style.width).toBe("320px");
  });
});

test("uses a custom minimum menu width when provided", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 720,
  });
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
      minWidth={320}
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );

  await waitFor(() => {
    const wrapper = getPortalWrapper();
    expect(wrapper.style.width).toBe("320px");
  });
});

test("right-aligns the dropdown to the trigger when requested", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 720,
  });
  jest.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(120);

  const button = document.createElement("button");
  Object.defineProperty(button, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      createRect({
        top: 200,
        bottom: 232,
        left: 500,
        right: 600,
      }),
  });

  render(
    <CommonDropdownItemsDefaultWrapper
      isOpen={true}
      setOpen={() => {}}
      buttonRef={{ current: button }}
      horizontalAlign="right"
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );

  await waitFor(() => {
    const wrapper = getPortalWrapper();
    expect(wrapper.style.left).toBe("376px");
  });
});

test("renders the menu scroll region with dark scrollbar styling", async () => {
  render(
    <CommonDropdownItemsDefaultWrapper
      isOpen={true}
      setOpen={() => {}}
      buttonRef={{ current: null }}
    >
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );

  const scrollRegion = screen.getByRole("menu")
    .firstElementChild as HTMLElement;
  expect(scrollRegion).toHaveClass(
    "[scrollbar-color:#3f3f46_#18181b]",
    "[scrollbar-width:thin]"
  );
});

test("closes when focus moves outside the trigger and portaled menu by default", async () => {
  const setOpen = jest.fn();
  const buttonRef = React.createRef<HTMLButtonElement>();

  render(
    <>
      <button ref={buttonRef} type="button">
        Trigger
      </button>
      <button type="button">Outside</button>
      <CommonDropdownItemsDefaultWrapper
        isOpen={true}
        setOpen={setOpen}
        buttonRef={buttonRef}
      >
        <li>
          <button type="button">Item</button>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </>
  );

  await screen.findByRole("menu");

  fireEvent.focusIn(screen.getByRole("button", { name: "Outside" }));

  expect(setOpen).toHaveBeenCalledWith(false);
});

test("does not close when opted out and focus moves outside the trigger and portaled menu", async () => {
  const setOpen = jest.fn();
  const buttonRef = React.createRef<HTMLButtonElement>();

  render(
    <>
      <button ref={buttonRef} type="button">
        Trigger
      </button>
      <button type="button">Outside</button>
      <CommonDropdownItemsDefaultWrapper
        isOpen={true}
        setOpen={setOpen}
        buttonRef={buttonRef}
        closeOnFocusOutside={false}
      >
        <li>
          <button type="button">Item</button>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </>
  );

  await screen.findByRole("menu");

  fireEvent.focusIn(screen.getByRole("button", { name: "Outside" }));

  expect(setOpen).not.toHaveBeenCalled();
});
