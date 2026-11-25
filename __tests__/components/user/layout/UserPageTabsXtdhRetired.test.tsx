import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { render, screen } from "@testing-library/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}));
const useAuthMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => useAuthMock(),
}));
const useSeizeConnectContextMock = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => useSeizeConnectContextMock(),
}));
const capacitorMock = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
}));
const mockXtdhRetired = jest.fn(() => false);
jest.mock("@/hooks/useXtdhRetirement", () => ({
  useXtdhRetired: () => mockXtdhRetired(),
}));
const useIdentityMock = jest.fn();
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => useIdentityMock(),
}));
jest.mock("@/components/user/layout/UserPageTab", () => ({
  __esModule: true,
  default: (p: any) => (
    <div
      data-testid="tab"
      data-active={p.activeTabId === p.tab.id ? "true" : "false"}
    >
      {p.tab.id}
    </div>
  ),
}));
const getTabIds = () =>
  screen.getAllByTestId("tab").map((tab) => tab.textContent);

const getActiveTabIds = () =>
  screen
    .getAllByTestId("tab")
    .filter((tab) => tab.getAttribute("data-active") === "true")
    .map((tab) => tab.textContent);

const initialProfile = Object.assign(new ApiIdentity(), {
  profile_wave_id: null,
});

const renderTabs = ({
  showWaves,
  isIos,
  connectedProfile = null,
  fetchingProfile = false,
  pathname = "/[user]",
  address = undefined,
  connectionState = "disconnected",
}: {
  showWaves: boolean;
  isIos: boolean;
  connectedProfile?: any;
  fetchingProfile?: boolean;
  pathname?: string;
  address?: string;
  connectionState?:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";
}) => {
  const router = { push: jest.fn(), replace: jest.fn() };
  (useRouter as jest.Mock).mockReturnValue(router);
  (usePathname as jest.Mock).mockReturnValue(pathname);
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  (useParams as jest.Mock).mockReturnValue({ user: "testuser" });
  capacitorMock.mockReturnValue({ isIos });
  useAuthMock.mockReturnValue({
    showWaves,
    connectedProfile,
    fetchingProfile,
  });
  useIdentityMock.mockReturnValue({
    profile: { profile_wave_id: null },
    isLoading: false,
  });
  useSeizeConnectContextMock.mockReturnValue({
    address,
    connectionState,
  });
  return {
    router,
    ...render(<UserPageTabs initialProfile={initialProfile} />),
  };
};

describe("UserPageTabs and the xTDH retirement", () => {
  it("shows the xTDH tab while xTDH is live", () => {
    mockXtdhRetired.mockReturnValue(false);
    renderTabs({ showWaves: false, isIos: false });
    expect(getTabIds()).toContain(USER_PAGE_TAB_IDS.XTDH);
  });

  it("hides the xTDH tab once xTDH is retired", () => {
    mockXtdhRetired.mockReturnValue(true);
    renderTabs({ showWaves: false, isIos: false });
    const tabs = getTabIds();
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.XTDH);
    expect(tabs).toContain(USER_PAGE_TAB_IDS.COLLECTED);
  });

  it("keeps a link to the retired xTDH tab on its page", () => {
    mockXtdhRetired.mockReturnValue(true);
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/xtdh",
    });
    expect(router.replace).not.toHaveBeenCalled();
    expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.XTDH);
    expect(getActiveTabIds()).toEqual([]);
  });
});
