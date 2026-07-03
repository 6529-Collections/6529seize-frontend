import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { DEFAULT_DROP_FORGE_PERMISSIONS } from "../../helpers/dropForgePermissions";

let clickAwayCb: () => void;
let escapeCb: () => void;
let enterCb: () => void;

const useQueryMock = jest.fn();
const useRouter = jest.fn();
const usePathname = jest.fn();
const useSearchParams = jest.fn();
const useWaves = jest.fn();
const useLocalPreference = jest.fn();
const mockUseDeviceInfo = jest.fn();
const useAppWalletsMock = jest.fn();
const useCookieConsentMock = jest.fn();
const useSidebarSectionsMock = jest.fn();
const capacitorMock = jest.fn();
const useDropForgePermissionsMock = jest.fn();
const originalScrollIntoView = Element.prototype.scrollIntoView;
const originalHtmlScrollIntoView = HTMLElement.prototype.scrollIntoView;

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
  HTMLElement.prototype.scrollIntoView = originalHtmlScrollIntoView;
});

jest.mock("react-use", () => {
  return {
    createBreakpoint: () => () => "MD",
    useClickAway: (_ref: any, cb: () => void) => {
      clickAwayCb = cb;
    },
    useKeyPressEvent: (key: string, cb: () => void) => {
      if (key === "Escape") {
        escapeCb = cb;
      } else if (key === "Enter") {
        enterCb = cb;
      }
    },
    useDebounce: (fn: () => void, _delay: number, deps: any[]) => {
      React.useEffect(fn, deps);
    },
  };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
  useInfiniteQuery: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
  }),
  keepPreviousData: (prev: unknown) => prev,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => useRouter(),
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));
jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: any[]) => useWaves(...args),
}));
jest.mock(
  "@/hooks/useLocalPreference",
  () =>
    (...args: any[]) =>
      useLocalPreference(...args)
);
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
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => useDropForgePermissionsMock(),
}));
jest.mock("@/components/header/header-search/HeaderSearchModalItem", () => {
  const MockHeaderSearchModalItem = (props: any) => (
    <div data-testid="item">{JSON.stringify(props)}</div>
  );
  MockHeaderSearchModalItem.displayName = "MockHeaderSearchModalItem";
  return MockHeaderSearchModalItem;
});

const profile = { handle: "alice", wallet: "0x1", display: "Alice", level: 1 };

const defaultSidebarSections: SidebarSection[] = [
  {
    key: "nfts",
    name: "NFTs",
    icon: () => null,
    items: [
      { name: "The Memes", href: "/the-memes" },
      { name: "NFT Activity", href: "/nft-activity" },
    ],
    subsections: [],
  },
  {
    key: "waves",
    name: "Waves",
    icon: () => null,
    items: [
      { name: "Waves", href: "/waves" },
      { name: "Discover Waves", href: "/discover" },
    ],
    subsections: [],
  },
  {
    key: "about",
    name: "About",
    icon: () => null,
    items: [{ name: "About", href: "/about" }],
    subsections: [
      {
        name: "Network Data",
        items: [
          { name: "xTDH", href: "/xtdh" },
          { name: "Wave Score", href: "/network/wave-score" },
        ],
      },
      {
        name: "Delegation",
        items: [
          { name: "Delegation Center", href: "/delegation/delegation-center" },
        ],
      },
    ],
  },
];

interface SetupOptions {
  queryImpl?: (params: {
    queryKey: [QueryKey, string];
    profilesRefetch: jest.Mock<Promise<unknown>, []>;
    nftsRefetch: jest.Mock<Promise<unknown>, []>;
    enabled?: boolean | undefined;
  }) =>
    | {
        isFetching: boolean;
        data: unknown;
        error?: Error | undefined;
        refetch: jest.Mock<Promise<unknown>, []>;
      }
    | undefined;
  selectedCategory?:
    | "ALL"
    | "PROFILES"
    | "NFTS"
    | "WAVES"
    | "PAGES"
    | undefined;
  wavesReturn?:
    | {
        waves: unknown[];
        isFetching: boolean;
        error: Error | null;
        refetch: jest.Mock<Promise<unknown>, []>;
      }
    | undefined;
  profilesRefetch?: jest.Mock<Promise<unknown>, []> | undefined;
  nftsRefetch?: jest.Mock<Promise<unknown>, []> | undefined;
  wavesRefetch?: jest.Mock<Promise<unknown>, []> | undefined;
  sidebarSections?: SidebarSection[] | undefined;
  dropForgePermissions?: typeof DEFAULT_DROP_FORGE_PERMISSIONS | undefined;
}

function setup(options: SetupOptions = {}) {
  const {
    queryImpl,
    selectedCategory = "ALL",
    wavesReturn,
    profilesRefetch = jest.fn(() => Promise.resolve()),
    nftsRefetch = jest.fn(() => Promise.resolve()),
    wavesRefetch = jest.fn(() => Promise.resolve()),
    sidebarSections = defaultSidebarSections,
    dropForgePermissions,
  } = options;
  const push = jest.fn();
  const onClose = jest.fn();
  useRouter.mockReturnValue({ push });
  usePathname.mockReturnValue("/");
  useSearchParams.mockReturnValue(new URLSearchParams());
  mockUseDeviceInfo.mockReturnValue({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
    isAppleMobile: false,
  });
  useAppWalletsMock.mockReturnValue({ appWalletsSupported: true });
  useCookieConsentMock.mockReturnValue({ country: "US" });
  capacitorMock.mockReturnValue({ isIos: false });
  useSidebarSectionsMock.mockReturnValue(sidebarSections);
  useDropForgePermissionsMock.mockReturnValue(
    dropForgePermissions ?? { ...DEFAULT_DROP_FORGE_PERMISSIONS }
  );
  useWaves.mockReturnValue(
    wavesReturn ?? {
      waves: [],
      isFetching: false,
      error: null,
      refetch: wavesRefetch,
    }
  );
  useLocalPreference.mockReturnValue([selectedCategory, jest.fn()]);
  if (queryImpl) {
    useQueryMock.mockImplementation(({ queryKey, enabled }) =>
      queryImpl({
        queryKey: queryKey as [QueryKey, string],
        profilesRefetch,
        nftsRefetch,
        enabled,
      })
    );
  } else {
    useQueryMock.mockImplementation(({ queryKey, enabled }) => {
      if (enabled === false) {
        const refetch =
          queryKey[0] === QueryKey.PROFILE_SEARCH
            ? profilesRefetch
            : nftsRefetch;
        return {
          isFetching: false,
          data: undefined,
          error: undefined,
          refetch,
        };
      }

      if (queryKey[0] === QueryKey.PROFILE_SEARCH) {
        return {
          isFetching: false,
          data: [profile],
          error: undefined,
          refetch: profilesRefetch,
        };
      }
      return {
        isFetching: false,
        data: [],
        error: undefined,
        refetch: nftsRefetch,
      };
    });
  }
  render(<HeaderSearchModal onClose={onClose} wave={null} />);
  return { onClose, push, profilesRefetch, nftsRefetch, wavesRefetch };
}

describe("HeaderSearchModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("associates the search input with an accessible label", () => {
    setup();
    expect(
      screen.getByRole("textbox", {
        name: "Search",
      })
    ).toBeInTheDocument();
  });

  it("calls onClose when escape is pressed", () => {
    const { onClose } = setup();
    escapeCb();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders search results when query returns items", () => {
    setup();
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "abc" } });
    expect(
      screen.getByRole("heading", { name: "Profiles" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("item")).toBeInTheDocument();
  });

  it("clears search input when the clear button is pressed", () => {
    setup();
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "faq" } });

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("includes navigation pages in search results when query matches", () => {
    setup();
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "Delegation" } });

    expect(screen.getByRole("heading", { name: "Pages" })).toBeInTheDocument();
    const renderedItems = screen
      .getAllByTestId("item")
      .map((element) => element.textContent ?? "");
    expect(
      renderedItems.some((content) => content.includes('"type":"PAGE"'))
    ).toBe(true);
  });

  it("finds the Tech about page from sidebar pages", () => {
    setup({
      sidebarSections: [
        ...defaultSidebarSections,
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [],
          subsections: [
            {
              name: "Resources",
              items: [{ name: "Tech", href: "/about/tech" }],
            },
          ],
        },
      ],
    });
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "tech" } });

    const renderedItems = screen
      .getAllByTestId("item")
      .map((element) => element.textContent ?? "");
    expect(
      renderedItems.some(
        (content) =>
          content.includes('"title":"Tech"') &&
          content.includes('"/about/tech"') &&
          content.includes('"breadcrumbs":["About","Resources"]')
      )
    ).toBe(true);
  });

  it("finds the Network Wave Score page by formula aliases", () => {
    setup();
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "wave rep formula" } });

    const renderedItems = screen
      .getAllByTestId("item")
      .map((element) => element.textContent ?? "");
    expect(
      renderedItems.some(
        (content) =>
          content.includes('"title":"Wave Score"') &&
          content.includes('"/network/wave-score"') &&
          content.includes('"breadcrumbs":["About","Network Data"]')
      )
    ).toBe(true);
  });

  it("shows one Network Nerd page result for cards and interactions aliases", async () => {
    setup({
      selectedCategory: "PAGES",
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "interactions leaderboard" } });

    const renderedItems = (await screen.findAllByTestId("item")).map(
      (element) => element.textContent ?? ""
    );
    const networkNerdItems = renderedItems.filter((content) =>
      content.includes('"/network/nerd"')
    );

    expect(networkNerdItems).toHaveLength(1);
    expect(networkNerdItems[0]).toContain('"title":"Network Nerd"');
    expect(networkNerdItems[0]).toContain(
      '"breadcrumbs":["About","Network Data"]'
    );
    expect(networkNerdItems[0]).not.toContain(
      '"title":"Network Nerd Cards Collected"'
    );
    expect(networkNerdItems[0]).not.toContain(
      '"title":"Network Nerd Interactions"'
    );
  });

  it("matches close pluralized page titles for page searches", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "nfts",
          name: "NFTs",
          icon: () => null,
          items: [{ name: "Memes Calendar", href: "/meme-calendar" }],
          subsections: [],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "meme calendar" } });

    const items = await screen.findAllByTestId("item");
    expect(
      items.some(
        (item) =>
          (item.textContent ?? "").includes('"title":"Memes Calendar"') &&
          (item.textContent ?? "").includes('"/meme-calendar"')
      )
    ).toBe(true);
  });

  it("matches close singularized page titles for page searches", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "nfts",
          name: "NFTs",
          icon: () => null,
          items: [{ name: "Meme Calendar", href: "/meme-calendar" }],
          subsections: [],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "memes calendar" } });

    const items = await screen.findAllByTestId("item");
    expect(
      items.some(
        (item) =>
          (item.textContent ?? "").includes('"title":"Meme Calendar"') &&
          (item.textContent ?? "").includes('"/meme-calendar"')
      )
    ).toBe(true);
  });

  it("matches partial token page searches with close pluralization", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "nfts",
          name: "NFTs",
          icon: () => null,
          items: [{ name: "Memes Calendar", href: "/meme-calendar" }],
          subsections: [],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "meme cal" } });

    const items = await screen.findAllByTestId("item");
    expect(
      items.some(
        (item) =>
          (item.textContent ?? "").includes('"title":"Memes Calendar"') &&
          (item.textContent ?? "").includes('"/meme-calendar"')
      )
    ).toBe(true);
  });

  it("matches page queries that span breadcrumbs and titles", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [],
          subsections: [
            {
              name: "Network Data",
              items: [{ name: "Health", href: "/network/health" }],
            },
          ],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "network data health" } });

    const items = await screen.findAllByTestId("item");
    expect(
      items.some(
        (item) =>
          (item.textContent ?? "").includes('"title":"Health"') &&
          (item.textContent ?? "").includes('"/network/health"')
      )
    ).toBe(true);
  });

  it("prioritizes exact href matches ahead of title and breadcrumb fallbacks", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [{ name: "Network Health", href: "/about/network-health" }],
          subsections: [
            {
              name: "Network Data",
              items: [{ name: "Health", href: "/network/health" }],
            },
          ],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "/network/health" } });

    const items = await screen.findAllByTestId("item");
    expect(items[0]?.textContent).toContain('"/network/health"');
  });

  it("prioritizes path-like partial href queries ahead of token-based title matches", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [{ name: "Network Health", href: "/about/network-health" }],
          subsections: [
            {
              name: "Network Data",
              items: [{ name: "Health", href: "/network/health" }],
            },
          ],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "/network/he" } });

    const items = await screen.findAllByTestId("item");
    expect(items[0]?.textContent).toContain('"/network/health"');
  });

  it("includes drop forge pages in search results when accessible", () => {
    setup({
      selectedCategory: "PAGES",
      dropForgePermissions: {
        hasWallet: true,
        permissionsLoading: false,
        canAccessLanding: true,
        canAccessCraft: true,
        canAccessLaunch: true,
        canAccessLaunchPage: true,
        isDistributionAdmin: true,
        isClaimsAdmin: true,
        isDropForgeAdmin: false,
      },
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "drop forge" } });

    const renderedItems = screen
      .getAllByTestId("item")
      .map((element) => element.textContent ?? "");
    expect(
      renderedItems.some((content) => content.includes('"/drop-forge"'))
    ).toBe(true);
    expect(
      renderedItems.some((content) => content.includes('"/drop-forge/craft"'))
    ).toBe(true);
    expect(
      renderedItems.some((content) => content.includes('"/drop-forge/launch"'))
    ).toBe(true);
  });

  it("prioritizes exact page title matches ahead of partial matches", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [],
          subsections: [
            {
              name: "Delegation",
              items: [
                {
                  name: "Delegation FAQ",
                  href: "/delegation/delegation-faq",
                },
              ],
            },
            {
              name: "Support",
              items: [{ name: "FAQ", href: "/about/faq" }],
            },
          ],
        },
      ],
      queryImpl: () => ({
        isFetching: false,
        data: [],
        error: undefined,
        refetch: jest.fn(() => Promise.resolve()),
      }),
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "faq" } });

    const items = await screen.findAllByTestId("item");
    expect(items[0]?.textContent).toContain('"title":"FAQ"');
    expect(items[1]?.textContent).toContain('"title":"Delegation FAQ"');
  });

  it("renders result categories in deterministic order in All view", async () => {
    const profiles = [
      { handle: "alice", wallet: "0x1" },
      { handle: "bob", wallet: "0x2" },
      { handle: "carol", wallet: "0x3" },
    ];
    const nfts = [
      { id: 1, name: "NFT One", contract: "0xabc" },
      { id: 2, name: "NFT Two", contract: "0xabc" },
    ];
    const waves = [
      { id: "w1", serial_no: 1 },
      { id: "w2", serial_no: 2 },
      { id: "w3", serial_no: 3 },
      { id: "w4", serial_no: 4 },
    ];

    setup({
      sidebarSections: [
        {
          key: "about",
          name: "About",
          icon: () => null,
          items: [],
          subsections: [
            {
              name: "Support",
              items: [{ name: "FAQ", href: "/about/faq" }],
            },
          ],
        },
      ],
      queryImpl: ({ queryKey }) => {
        const [key] = queryKey;
        if (key === QueryKey.PROFILE_SEARCH) {
          return {
            isFetching: false,
            data: profiles,
            error: undefined,
            refetch: jest.fn(() => Promise.resolve()),
          };
        }
        return {
          isFetching: false,
          data: nfts,
          error: undefined,
          refetch: jest.fn(() => Promise.resolve()),
        };
      },
      wavesReturn: {
        waves,
        isFetching: false,
        error: null,
        refetch: jest.fn(() => Promise.resolve()),
      },
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "faq" } });

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Pages",
      "NFTs",
      "Profiles",
      "Waves",
    ]);
  });

  it("triggers onClose on click away", () => {
    const { onClose } = setup();
    clickAwayCb();
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates on enter key", () => {
    const { push } = setup();
    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "alice" } });
    enterCb();
    expect(push).toHaveBeenCalled();
  });

  it("shows an error message and allows retry when a search fails", async () => {
    const profilesRefetch = jest.fn(() => Promise.resolve());
    const { wavesRefetch: wavesRefetchMock } = setup({
      profilesRefetch,
      queryImpl: ({ queryKey, profilesRefetch, nftsRefetch }) => {
        const [key, search] = queryKey;
        if (key === QueryKey.PROFILE_SEARCH) {
          const shouldError = typeof search === "string" && search.length >= 3;
          return {
            isFetching: false,
            data: [],
            error: shouldError ? new Error("Failed to fetch") : undefined,
            refetch: profilesRefetch,
          };
        }
        return {
          isFetching: false,
          data: [],
          error: undefined,
          refetch: nftsRefetch,
        };
      },
    });

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "alice" } });

    expect(
      await screen.findByText(
        "Something went wrong while searching. Please try again."
      )
    ).toBeInTheDocument();

    const retryButton = await screen.findByRole("button", {
      name: /try again/i,
    });
    fireEvent.click(retryButton);

    expect(profilesRefetch).toHaveBeenCalled();
    expect(wavesRefetchMock).toHaveBeenCalled();
  });
});
