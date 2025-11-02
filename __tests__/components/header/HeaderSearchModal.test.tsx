import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

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

jest.mock("react-use", () => {
  return {
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
jest.mock("@/components/header/header-search/HeaderSearchModalItem", () => {
  const MockHeaderSearchModalItem = (props: any) => (
    <div data-testid="item">{JSON.stringify(props)}</div>
  );
  MockHeaderSearchModalItem.displayName = "MockHeaderSearchModalItem";
  return MockHeaderSearchModalItem;
});

const profile = { handle: "alice", wallet: "0x1", display: "Alice", level: 1 };

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

interface SetupOptions {
  queryImpl?: (params: {
    queryKey: [QueryKey, string];
    profilesRefetch: jest.Mock<Promise<unknown>, []>;
    nftsRefetch: jest.Mock<Promise<unknown>, []>;
    enabled?: boolean;
  }) => {
    isFetching: boolean;
    data: unknown;
    error?: Error;
    refetch: jest.Mock<Promise<unknown>, []>;
  };
  selectedCategory?: "ALL" | "PROFILES" | "NFTS" | "WAVES" | "PAGES";
  wavesReturn?: {
    waves: unknown[];
    isFetching: boolean;
    error: Error | null;
    refetch: jest.Mock<Promise<unknown>, []>;
  };
  profilesRefetch?: jest.Mock<Promise<unknown>, []>;
  nftsRefetch?: jest.Mock<Promise<unknown>, []>;
  wavesRefetch?: jest.Mock<Promise<unknown>, []>;
  sidebarSections?: typeof defaultSidebarSections;
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
  render(<HeaderSearchModal onClose={onClose} />);
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

  it("prioritizes exact page title matches ahead of partial matches", async () => {
    setup({
      selectedCategory: "PAGES",
      sidebarSections: [
        {
          key: "tools",
          name: "Tools",
          icon: () => null,
          items: [],
          subsections: [
            {
              name: "NFT Delegation",
              items: [
                {
                  name: "Delegation FAQs",
                  href: "/delegation/delegation-faq",
                },
              ],
            },
          ],
        },
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
    expect(items[0].textContent).toContain('"title":"FAQ"');
    expect(items[1].textContent).toContain('"title":"Delegation FAQs"');
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
