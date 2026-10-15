import HeaderActionButtons from "@/components/header/HeaderActionButtons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Link from "next/link";
import type { ComponentProps } from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: jest.fn(
    ({
      prefetch: _prefetch,
      ...props
    }: ComponentProps<"a"> & { prefetch?: boolean }) => <a {...props} />
  ),
}));

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
    expect(Link).not.toHaveBeenCalled();
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
    expect(Link).not.toHaveBeenCalled();
  });

  it("fully prefetches the native new-message route through its link", () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
    (usePn as jest.Mock).mockReturnValue("/messages");
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    render(<HeaderActionButtons />);

    const link = screen.getByRole("link", { name: "Create DM" });
    expect(link).toHaveAttribute("href", "/messages/create");
    expect(link).toHaveClass("tw-size-10");
    expect(Link).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/messages/create", prefetch: true }),
      undefined
    );
    expect(push).not.toHaveBeenCalled();
  });

  it.each(["/waves", "/waves/create", "/messages/create", "/other"])(
    "does not mount a prefetching dm link outside messages on %s",
    (pathname) => {
      (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
      (usePn as jest.Mock).mockReturnValue(pathname);
      (useRt as jest.Mock).mockReturnValue({
        push: jest.fn(),
        replace: jest.fn(),
      });
      render(<HeaderActionButtons />);
      expect(Link).not.toHaveBeenCalled();
    }
  );

  it("mounts the prefetching link when the native header enters messages", () => {
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: true });
    (useRt as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    const { rerender } = render(<HeaderActionButtons />);
    expect(Link).not.toHaveBeenCalled();
    (usePn as jest.Mock).mockReturnValue("/messages");
    rerender(<HeaderActionButtons />);
    expect(screen.getByRole("link", { name: "Create DM" })).toHaveAttribute(
      "href",
      "/messages/create"
    );
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
    rerender(<HeaderActionButtons />);
    expect(
      screen.queryByRole("link", { name: "Create DM" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create DM" })
    ).toBeInTheDocument();
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
