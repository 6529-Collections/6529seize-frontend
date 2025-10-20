import HeaderActionButtons from "@/components/header/HeaderActionButtons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: jest.fn(),
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

const { useViewContext: useCtx } = require("@/components/navigation/ViewContext");
const {
  useRouter: useRt,
  usePathname: usePn,
  useSearchParams: useSp,
} = require("next/navigation");
const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");

afterEach(() => jest.clearAllMocks());

describe("HeaderActionButtons", () => {
  beforeEach(() => {
    (usePn as jest.Mock).mockReturnValue("/waves");
    (useSp as jest.Mock).mockReturnValue(new URLSearchParams());
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  });

  it("creates new wave when active view is waves", async () => {
    (useCtx as jest.Mock).mockReturnValue({ activeView: "waves", homeActiveTab: "latest" });
    const push = jest.fn();
    const replace = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(replace).toHaveBeenCalledWith("/waves?create=wave", { scroll: false });
  });

  it("creates new wave on app when active view is waves", async () => {
    (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
    (useCtx as jest.Mock).mockReturnValue({ activeView: "waves", homeActiveTab: "latest" });
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(push).toHaveBeenCalledWith("/waves/create");
  });

  it("creates new dm when active view is messages", async () => {
    (usePn as jest.Mock).mockReturnValue("/messages");
    (useCtx as jest.Mock).mockReturnValue({ activeView: "messages", homeActiveTab: "latest" });
    const push = jest.fn();
    const replace = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(replace).toHaveBeenCalledWith("/messages?create=dm", { scroll: false });
  });

  it("creates new dm on app when active view is messages", async () => {
    (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
    (usePn as jest.Mock).mockReturnValue("/messages");
    (useCtx as jest.Mock).mockReturnValue({ activeView: "messages", homeActiveTab: "latest" });
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push, replace: jest.fn() });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(push).toHaveBeenCalledWith("/messages/create");
  });

  it("renders nothing for other views", () => {
    (usePn as jest.Mock).mockReturnValue("/other");
    (useCtx as jest.Mock).mockReturnValue({ activeView: "other", homeActiveTab: "latest" });
    (useRt as jest.Mock).mockReturnValue({ push: jest.fn(), replace: jest.fn() });
    const { container } = render(<HeaderActionButtons />);
    expect(container.firstChild).toBeNull();
  });
});
