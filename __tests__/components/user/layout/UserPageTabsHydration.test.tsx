import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real platform detection and visibility hook: only the native bridge, the
// country and the route are mocked.
let mockNativePlatform: "ios" | "android" | "web" = "web";
let mockPathname = "/testuser/subscriptions";
let mockShowWaves = false;
let mockConnectedProfile: ApiIdentity | null = null;
const mockReplace = jest.fn();

jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: () => mockNativePlatform !== "web",
      getPlatform: () => mockNativePlatform,
    },
  };
});
jest.mock("@capacitor/app", () => ({
  App: {
    getState: jest.fn(async () => ({ isActive: true })),
    addListener: jest.fn(async () => ({ remove: jest.fn() })),
  },
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ user: "testuser" }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    showWaves: mockShowWaves,
    connectedProfile: mockConnectedProfile,
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

const SUBSCRIPTIONS = USER_PAGE_TAB_IDS.SUBSCRIPTIONS;
const initialProfile = Object.assign(new ApiIdentity(), {
  profile_wave_id: null,
});

let container: HTMLDivElement;
let root: Root | null = null;

const tree = () => <UserPageTabs initialProfile={initialProfile} />;
const tabIds = () =>
  Array.from(container.querySelectorAll("[data-testid='tab']")).map(
    (tab) => tab.textContent
  );
const activeTabIds = () =>
  Array.from(container.querySelectorAll("[data-active='true']")).map(
    (tab) => tab.textContent
  );

async function hydrateFromServerHtml() {
  container.innerHTML = renderToString(tree());
  await act(async () => {
    root = hydrateRoot(container, tree());
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNativePlatform = "web";
  mockPathname = "/testuser/subscriptions";
  mockShowWaves = false;
  mockConnectedProfile = null;
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

describe("profile Subscriptions tab around hydration", () => {
  it.each(["owner", "visitor"])(
    "hydrates the tabs when a %s session is ready before the profile",
    async (viewer) => {
      mockPathname = "/testuser/collected";
      container.innerHTML = renderToString(tree());
      expect(tabIds()).not.toContain(USER_PAGE_TAB_IDS.BRAIN);
      expect(tabIds()).not.toContain(USER_PAGE_TAB_IDS.PROXY);

      mockShowWaves = true;
      mockConnectedProfile = Object.assign(new ApiIdentity(), {
        normalised_handle: viewer === "owner" ? "testuser" : "anotheruser",
        wallets: [],
      });
      const onRecoverableError = jest.fn();
      await act(async () => {
        root = hydrateRoot(container, tree(), { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(tabIds()).toContain(USER_PAGE_TAB_IDS.BRAIN);
      expect(tabIds().includes(USER_PAGE_TAB_IDS.PROXY)).toBe(
        viewer === "owner"
      );
      expect(activeTabIds()).toEqual([USER_PAGE_TAB_IDS.COLLECTED]);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  it.each(["web", "android", "ios"] as const)(
    "omits the tab from the server HTML on %s, even on the subscriptions route",
    (platform) => {
      mockNativePlatform = platform;

      const html = renderToString(tree());

      expect(html).not.toContain(SUBSCRIPTIONS);
      expect(html).toContain(USER_PAGE_TAB_IDS.REP);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  it.each(["web", "android"] as const)(
    "shows the tab as active on %s after hydration without redirecting a deep link",
    async (platform) => {
      mockNativePlatform = platform;

      await hydrateFromServerHtml();

      expect(tabIds()).toContain(SUBSCRIPTIONS);
      expect(activeTabIds()).toEqual([SUBSCRIPTIONS]);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  it("adds the tab after hydration on web when another tab is open", async () => {
    mockPathname = "/testuser/collected";
    expect(renderToString(tree())).not.toContain(SUBSCRIPTIONS);

    await hydrateFromServerHtml();

    expect(tabIds()).toContain(SUBSCRIPTIONS);
    expect(activeTabIds()).toEqual([USER_PAGE_TAB_IDS.COLLECTED]);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects a hydrated iOS subscriptions deep link to Identity", async () => {
    mockNativePlatform = "ios";

    await hydrateFromServerHtml();

    expect(tabIds()).not.toContain(SUBSCRIPTIONS);
    expect(activeTabIds()).toEqual([USER_PAGE_TAB_IDS.REP]);
    expect(mockReplace).toHaveBeenCalledWith("/testuser");
  });
});
