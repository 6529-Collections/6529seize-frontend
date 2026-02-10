import { render, screen } from "@testing-library/react";
import { useAuth } from "@/components/auth/Auth";
import BrainLeftSidebarCreateADirectMessageButton from "@/components/brain/left-sidebar/BrainLeftSidebarCreateADirectMessageButton";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
  usePathname: jest.fn(() => "/messages"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));
jest.mock("@/components/auth/Auth");

const mockedUseAuth = useAuth as jest.Mock;
const { useRouter, usePathname, useSearchParams } = require("next/navigation");
const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");

describe("BrainLeftSidebarCreateADirectMessageButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn(), push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue("/messages");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  });

  it('shows "Create DM" when user is connected with no active proxy', () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "john" },
      activeProfileProxy: null,
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/messages?create=dm");
    expect(screen.getByText("Create DM")).toBeInTheDocument();
  });

  it('shows "Direct Message" when no connected profile or active proxy present', () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    expect(screen.getByText("Direct Message")).toBeInTheDocument();
  });

  it('shows "Direct Message" when there is an active proxy', () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "john" },
      activeProfileProxy: { id: "1" },
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    expect(screen.getByText("Direct Message")).toBeInTheDocument();
  });
});
