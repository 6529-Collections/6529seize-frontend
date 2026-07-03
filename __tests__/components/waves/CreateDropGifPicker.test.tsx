import { fireEvent, render, screen } from "@testing-library/react";
import CreateDropGifPicker from "@/components/waves/CreateDropGifPicker";

jest.mock("gif-picker-react", () => ({
  __esModule: true,
  default: ({ onGifClick }: any) => (
    <button onClick={() => onGifClick({ url: "g" })} data-testid="picker" />
  ),
  Theme: { DARK: "dark" },
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: any;
};
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () => (props: DialogProps) => (
    <div data-testid="dialog" role="dialog" aria-label={props.title}>
      <button aria-label="Close panel" onClick={props.onClose}></button>
      {props.children}
    </div>
  )
);

describe("CreateDropGifPicker", () => {
  const originalFetch = global.fetch;
  const gifPickerTenorStack =
    "TypeError: undefined is not an object\n    at TenorManager (node_modules/gif-picker-react/src/managers/TenorManager.ts:103:1)";

  const createTenorFetch = (ok: boolean) =>
    jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      return {
        ok,
        json: jest.fn(async () =>
          url.includes("/categories") ? { tags: [] } : { results: [] }
        ),
      };
    }) as jest.Mock;

  const createTenorError = () => {
    const error = new TypeError(
      "undefined is not an object (evaluating 'e.results.map')"
    );
    Object.defineProperty(error, "stack", {
      value: gifPickerTenorStack,
    });

    return error;
  };

  beforeEach(() => {
    global.fetch = createTenorFetch(true) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("passes events to picker and dialog", async () => {
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole("dialog", { name: "GIF search" })).toBeVisible();

    fireEvent.click(await screen.findByTestId("picker"));
    expect(onSelect).toHaveBeenCalledWith("g");
    expect(screen.getByRole("status")).toHaveTextContent(
      "GIF search is ready."
    );

    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("shows an unavailable state when Tenor rejects the picker requests", async () => {
    global.fetch = createTenorFetch(false) as unknown as typeof fetch;
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );
    expect(screen.queryByTestId("picker")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveFocus();

    fireEvent.click(closeButton);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("shows an unavailable state when the Tenor probe rejects", async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError("Load failed");
    }) as unknown as typeof fetch;
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );
    expect(screen.queryByTestId("picker")).not.toBeInTheDocument();
  });

  it("switches to the unavailable state when the picker throws a known Tenor error", async () => {
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(await screen.findByTestId("picker")).toBeInTheDocument();

    const event = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(event, "reason", {
      value: createTenorError(),
    });
    fireEvent(window, event);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GIF search is temporarily unavailable."
    );
  });

  it("does not handle matching rejection messages without gif-picker stack evidence", async () => {
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(await screen.findByTestId("picker")).toBeInTheDocument();

    const event = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(event, "reason", {
      value: new TypeError(
        "undefined is not an object (evaluating 'e.results.map')"
      ),
    });
    const preventDefault = jest.spyOn(event, "preventDefault");
    fireEvent(window, event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("aborts the Tenor probe on unmount", () => {
    const signals: AbortSignal[] = [];
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) {
        signals.push(init.signal);
      }

      return new Promise<Response>(() => undefined);
    }) as unknown as typeof fetch;
    const onSelect = jest.fn();
    const setShow = jest.fn();
    const { publicEnv } = require("@/config/env");
    const { unmount } = render(
      <CreateDropGifPicker
        tenorApiKey={publicEnv.TENOR_API_KEY}
        show={true}
        setShow={setShow}
        onSelect={onSelect}
      />
    );

    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);

    unmount();

    expect(signals[0]?.aborted).toBe(true);
  });
});
