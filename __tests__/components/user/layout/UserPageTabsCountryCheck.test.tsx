import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { act, render, screen } from "@testing-library/react";

let mockIsIos = true;
const mockReplace = jest.fn();
const mockMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/testuser/subscriptions",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ user: "testuser" }),
}));
jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    setToast: jest.fn(),
    showWaves: false,
    connectedProfile: null,
    fetchingProfile: false,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: undefined,
    connectionState: "disconnected",
  }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: { profile_wave_id: null }, isLoading: false }),
}));
jest.mock("@/components/cookies/CookiesBanner", () => () => null);
jest.mock("@/components/user/layout/UserPageTab", () => ({
  __esModule: true,
  default: ({
    tab,
    activeTabId,
  }: {
    tab: { id: string };
    activeTabId: string;
  }) => (
    <div data-testid="tab" data-active={String(activeTabId === tab.id)}>
      {tab.id}
    </div>
  ),
}));

const fetchMock = jest.mocked(commonApiFetch);
const initialProfile = Object.assign(new ApiIdentity(), {
  profile_wave_id: null,
});

function SubscriptionsPanel() {
  mockMount();
  return <p>Subscription history</p>;
}

// Mirrors the profile layout: the tab bar above the gated subscriptions panel,
// under the cookie consent provider with a deferred country lookup.
function renderSubscriptionsDeepLink() {
  return render(
    <CookieConsentProvider>
      <UserPageTabs initialProfile={initialProfile} />
      <NftPurchasingGate>
        <SubscriptionsPanel />
      </NftPurchasingGate>
    </CookieConsentProvider>
  );
}

function deferCountryCheck() {
  const lookup: { resolve?: (response: unknown) => void } = {};
  fetchMock.mockReturnValue(
    new Promise((resolve) => {
      lookup.resolve = resolve;
    })
  );
  return (country: string) => lookup.resolve?.({ is_eu: true, country });
}

const getTabIds = () =>
  screen.queryAllByTestId("tab").map((tab) => tab.textContent);

beforeEach(() => {
  jest.clearAllMocks();
  mockIsIos = true;
});

describe("profile subscriptions deep link with the country check", () => {
  it.each(["US", "FR", ""])(
    "redirects immediately on iOS and stays hidden after the lookup returns %j",
    async (country) => {
      const resolveCountry = deferCountryCheck();
      renderSubscriptionsDeepLink();

      expect(mockReplace).toHaveBeenCalledWith("/testuser");
      expect(mockMount).not.toHaveBeenCalled();

      await act(async () => resolveCountry(country));

      expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledTimes(1);
    }
  );

  it("does not make Android or web wait for the check", () => {
    mockIsIos = false;
    deferCountryCheck();

    renderSubscriptionsDeepLink();

    expect(getTabIds()).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
    expect(screen.getByText("Subscription history")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
