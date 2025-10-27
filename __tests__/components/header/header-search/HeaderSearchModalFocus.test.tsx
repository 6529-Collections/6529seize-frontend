import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useClickAway, useKey, useKeyPressEvent } from "react-use";
import type { Handler, KeyFilter } from "react-use/lib/useKey";

jest.mock("focus-trap-react", () => jest.requireActual("focus-trap-react"));
jest.mock("react-use");

const useQueryMock = jest.fn();
const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();
const useWavesMock = jest.fn();
const useLocalPreferenceMock = jest.fn();
const useKeyMock = useKey as jest.MockedFunction<typeof useKey>;
const useClickAwayMock = useClickAway as jest.MockedFunction<
  typeof useClickAway
>;
const useKeyPressEventMock = useKeyPressEvent as jest.MockedFunction<
  (key: KeyFilter, keydown?: Handler | null, keyup?: Handler | null) => void
>;

const useAppWalletsMock = jest.fn();
const useCookieConsentMock = jest.fn();
const useSidebarSectionsMock = jest.fn();
const capacitorMock = jest.fn();

let escapeHandler: (() => void) | null = null;

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: any[]) => useWavesMock(...args),
}));

jest.mock("@/hooks/useLocalPreference", () => ({
  __esModule: true,
  default: (...args: any[]) => useLocalPreferenceMock(...args),
}));

jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: ({ children, elementRole }: any) => (
    <div role={elementRole}>{children}</div>
  ),
}));

jest.mock("@/hooks/useDeviceInfo");
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => useAppWalletsMock(),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => useCookieConsentMock(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
}));
jest.mock("@/hooks/useSidebarSections", () => {
  const actual = jest.requireActual("@/hooks/useSidebarSections");
  return {
    __esModule: true,
    useSidebarSections: (...args: any[]) => useSidebarSectionsMock(...args),
    mapSidebarSectionsToPages: actual.mapSidebarSectionsToPages,
  };
});

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const defaultSidebarSections = [
  {
    key: "tools",
    name: "Tools",
    icon: () => null,
    items: [
      { name: "Delegation Center", href: "/delegation/delegation-center" },
    ],
    subsections: [],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  escapeHandler = null;
  useKeyMock.mockImplementation(() => {});
  useClickAwayMock.mockImplementation(() => {});
  useKeyPressEventMock.mockImplementation(
    (key: KeyFilter, keydown?: Handler | null, _keyup?: Handler | null) => {
      const isEscape =
        key === "Escape" || (Array.isArray(key) && key.includes("Escape"));
      if (isEscape && keydown) {
        escapeHandler = () => keydown(new KeyboardEvent("keydown"));
      }
    }
  );
  useQueryMock.mockImplementation(({ queryKey }) => {
    switch (queryKey[0]) {
      case QueryKey.PROFILE_SEARCH:
      case QueryKey.NFTS_SEARCH:
        return {
          isFetching: false,
          data: [],
          error: undefined,
          refetch: jest.fn(),
        };
      default:
        return {
          isFetching: false,
          data: [],
          error: undefined,
          refetch: jest.fn(),
        };
    }
  });
  useRouterMock.mockReturnValue({ push: jest.fn() });
  usePathnameMock.mockReturnValue("/");
  useSearchParamsMock.mockReturnValue(new URLSearchParams());
  useWavesMock.mockReturnValue({
    waves: [],
    isFetching: false,
    error: null,
    refetch: jest.fn(),
  });
  useLocalPreferenceMock.mockReturnValue(["ALL", jest.fn()]);
  useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
  useAppWalletsMock.mockReturnValue({ appWalletsSupported: true });
  useCookieConsentMock.mockReturnValue({ country: "US" });
  capacitorMock.mockReturnValue({ isIos: false });
  useSidebarSectionsMock.mockReturnValue(defaultSidebarSections);
});

const PLACEHOLDER_TEXT = "Search 6529.io";

describe("HeaderSearchModal focus management", () => {
  it("keeps focus trapped within the modal while it is open", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton />);

    const trigger = screen.getByRole("button", { name: /search/i });
    await user.click(trigger);

    const input = await screen.findByPlaceholderText(PLACEHOLDER_TEXT);
    await waitFor(() => expect(input).toHaveFocus());

    await screen.findByRole("dialog");
    const modalRoot = document.body.querySelector(
      ".tailwind-scope.tw-cursor-default.tw-relative.tw-z-1000"
    ) as HTMLElement | null;
    expect(modalRoot).not.toBeNull();

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      const activeElement = document.activeElement as HTMLElement | null;
      expect(activeElement).not.toBe(trigger);
      expect(activeElement).not.toBe(document.body);
      expect(activeElement && modalRoot?.contains(activeElement)).toBe(true);
    }

    await user.tab({ shift: true });
    const activeElement = document.activeElement as HTMLElement | null;
    expect(activeElement).not.toBe(trigger);
    expect(activeElement).not.toBe(document.body);
    expect(activeElement && modalRoot?.contains(activeElement)).toBe(true);
  });

  it("returns focus to the trigger button when the modal closes", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton />);

    const trigger = screen.getByRole("button", { name: /search/i });
    await user.click(trigger);

    const closeButton = await screen.findByRole("button", {
      name: /close search/i,
    });
    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER_TEXT)
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    await user.keyboard("[Space]");

    await screen.findByPlaceholderText(PLACEHOLDER_TEXT);

    expect(escapeHandler).not.toBeNull();

    act(() => {
      escapeHandler?.();
    });

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(PLACEHOLDER_TEXT)
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});
