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
jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: any[]) => useWaves(...args),
}));
jest.mock(
  "@/hooks/useLocalPreference",
  () =>
    (...args: any[]) =>
      useLocalPreference(...args)
);
jest.mock("@/components/header/header-search/HeaderSearchModalItem", () => {
  const MockHeaderSearchModalItem = (props: any) => (
    <div data-testid="item">{JSON.stringify(props)}</div>
  );
  MockHeaderSearchModalItem.displayName = "MockHeaderSearchModalItem";
  return MockHeaderSearchModalItem;
});

const profile = { handle: "alice", wallet: "0x1", display: "Alice", level: 1 };

interface SetupOptions {
  queryImpl?: (params: {
    queryKey: [QueryKey, string];
    profilesRefetch: jest.Mock<Promise<unknown>, []>;
    nftsRefetch: jest.Mock<Promise<unknown>, []>;
  }) => {
    isFetching: boolean;
    data: unknown;
    error?: Error;
    refetch: jest.Mock<Promise<unknown>, []>;
  };
  selectedCategory?: "PROFILES" | "NFTS" | "WAVES";
  wavesReturn?: {
    waves: unknown[];
    isFetching: boolean;
    error: Error | null;
    refetch: jest.Mock<Promise<unknown>, []>;
  };
  profilesRefetch?: jest.Mock<Promise<unknown>, []>;
  nftsRefetch?: jest.Mock<Promise<unknown>, []>;
  wavesRefetch?: jest.Mock<Promise<unknown>, []>;
}

function setup(options: SetupOptions = {}) {
  const {
    queryImpl,
    selectedCategory = "PROFILES",
    wavesReturn,
    profilesRefetch = jest.fn(() => Promise.resolve()),
    nftsRefetch = jest.fn(() => Promise.resolve()),
    wavesRefetch = jest.fn(() => Promise.resolve()),
  } = options;
  const push = jest.fn();
  const onClose = jest.fn();
  useRouter.mockReturnValue({ push });
  usePathname.mockReturnValue("/");
  useSearchParams.mockReturnValue(new URLSearchParams());
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
    useQueryMock.mockImplementation(({ queryKey }) =>
      queryImpl({
        queryKey: queryKey as [QueryKey, string],
        profilesRefetch,
        nftsRefetch,
      })
    );
  } else {
    useQueryMock.mockImplementation(({ queryKey }) => {
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
    expect(screen.getByTestId("item")).toBeInTheDocument();
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
    setup({
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
  });
});
