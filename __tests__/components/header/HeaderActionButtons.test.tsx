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
    (useRt as jest.Mock).mockReturnValue({ push, replace });
    const pushState = jest.spyOn(globalThis.history, "pushState");
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(pushState).toHaveBeenCalledWith(null, "", "/waves?create=wave");
    expect(replace).not.toHaveBeenCalled();
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
    (useRt as jest.Mock).mockReturnValue({ push, replace });
    const pushState = jest.spyOn(globalThis.history, "pushState");
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(pushState).toHaveBeenCalledWith(null, "", "/messages?create=dm");
    expect(replace).not.toHaveBeenCalled();
  });

  it("creates new dm on app when on messages route", async () => {
    (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
    globalThis.history.replaceState(null, "", "/messages");
    (usePn as jest.Mock).mockReturnValue("/messages");
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(push).toHaveBeenCalledWith("/messages/create");
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
