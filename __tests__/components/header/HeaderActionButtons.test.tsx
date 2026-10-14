import HeaderActionButtons from "@/components/header/HeaderActionButtons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/waves"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

const {
  useRouter: useRt,
  usePathname: usePn,
  useSearchParams: useSp,
} = require("next/navigation");
const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  globalThis.history.replaceState(null, "", "/");
});

describe("HeaderActionButtons", () => {
  beforeEach(() => {
    globalThis.history.replaceState(null, "", "/waves");
    (usePn as jest.Mock).mockReturnValue("/waves");
    (useSp as jest.Mock).mockReturnValue(new URLSearchParams());
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  });

  it("creates new wave on the waves route with native history", async () => {
    const push = jest.fn();
    const replace = jest.fn();
    const prefetch = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace, prefetch });
    const pushState = jest.spyOn(globalThis.history, "pushState");
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(pushState).toHaveBeenCalledWith(null, "", "/waves?create=wave");
    expect(replace).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("creates new wave on app when on waves route", async () => {
    (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(push).toHaveBeenCalledWith("/waves/create");
  });

  it("creates new dm on the messages route with native history", async () => {
    globalThis.history.replaceState(null, "", "/messages");
    (usePn as jest.Mock).mockReturnValue("/messages");
    const push = jest.fn();
    const replace = jest.fn();
    const prefetch = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace, prefetch });
    const pushState = jest.spyOn(globalThis.history, "pushState");
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(pushState).toHaveBeenCalledWith(null, "", "/messages?create=dm");
    expect(replace).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("prefetches before opening a new dm in the app", async () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
    globalThis.history.replaceState(null, "", "/messages");
    (usePn as jest.Mock).mockReturnValue("/messages");
    const push = jest.fn();
    const prefetch = jest.fn();
    (useRt as jest.Mock).mockReturnValue({
      push,
      replace: jest.fn(),
      prefetch,
    });
    const { rerender } = render(<HeaderActionButtons />);
    expect(prefetch).toHaveBeenCalledWith("/messages/create");
    expect(push).not.toHaveBeenCalled();
    rerender(<HeaderActionButtons />);
    expect(prefetch).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(push).toHaveBeenCalledWith("/messages/create");
  });

  it.each(["/waves", "/waves/create", "/messages/create", "/other"])(
    "does not prefetch the dm composer without its button on %s",
    (pathname) => {
      (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
      (usePn as jest.Mock).mockReturnValue(pathname);
      const prefetch = jest.fn();
      (useRt as jest.Mock).mockReturnValue({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch,
      });
      render(<HeaderActionButtons />);
      expect(prefetch).not.toHaveBeenCalled();
    }
  );

  it("prefetches when the native header switches into messages", () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
    const prefetch = jest.fn();
    (useRt as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch,
    });
    const { rerender } = render(<HeaderActionButtons />);
    expect(prefetch).not.toHaveBeenCalled();
    (usePn as jest.Mock).mockReturnValue("/messages");
    rerender(<HeaderActionButtons />);
    expect(prefetch).toHaveBeenCalledWith("/messages/create");
  });

  it("does not render create wave button on waves create route", () => {
    (usePn as jest.Mock).mockReturnValue("/waves/create");
    (useRt as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    render(<HeaderActionButtons />);
    expect(
      screen.queryByRole("button", { name: "Create Wave" })
    ).not.toBeInTheDocument();
  });

  it("renders nothing for other views", () => {
    (usePn as jest.Mock).mockReturnValue("/other");
    (useRt as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    const { container } = render(<HeaderActionButtons />);
    expect(container.firstChild).toBeNull();
  });
});
