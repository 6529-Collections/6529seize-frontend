import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import HeaderSearchModal from "./HeaderSearchModal";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const useQueryMock = jest.fn();
const useWavesMock = jest.fn();
const mockUseLocalPreference = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: unknown[]) => useWavesMock(...args),
}));

jest.mock("@/hooks/useLocalPreference", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseLocalPreference(...args),
}));

jest.mock("react-use", () => {
  const React = require("react");
  return {
    useClickAway: jest.fn(),
    useKeyPressEvent: jest.fn(),
    useDebounce: (fn: () => void, _delay: number, deps: unknown[]) => {
      React.useEffect(fn, deps);
    },
  };
});

jest.mock("./HeaderSearchModalItem", () => () => null);

describe("HeaderSearchModal error state", () => {
  let profilesRefetch: jest.Mock;
  let nftsRefetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    profilesRefetch = jest.fn().mockResolvedValue(undefined);
    nftsRefetch = jest.fn().mockResolvedValue(undefined);

    mockUseLocalPreference.mockReturnValue(["PROFILES", jest.fn()]);
    useWavesMock.mockReturnValue({
      waves: [],
      isFetching: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(undefined),
    });

    useQueryMock.mockImplementation(({ queryKey }: { queryKey: [QueryKey, string] }) => {
      const [key, search] = queryKey;

      if (key === QueryKey.PROFILE_SEARCH) {
        const shouldError = typeof search === "string" && search.length >= 3;
        return {
          data: [],
          isFetching: false,
          error: shouldError ? new Error("Failed to fetch") : undefined,
          refetch: profilesRefetch,
        };
      }

      if (key === QueryKey.NFTS_SEARCH) {
        return {
          data: [],
          isFetching: false,
          error: undefined,
          refetch: nftsRefetch,
        };
      }

      return {
        data: [],
        isFetching: false,
        error: undefined,
        refetch: jest.fn().mockResolvedValue(undefined),
      };
    });
  });

  it("displays an error message when the profile search request fails", async () => {
    render(<HeaderSearchModal onClose={jest.fn()} />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "alice" } });

    expect(
      await screen.findByText(
        "Something went wrong while searching. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("allows retrying after a failed search", async () => {
    render(<HeaderSearchModal onClose={jest.fn()} />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "alice" } });

    const retryButton = await screen.findByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(profilesRefetch).toHaveBeenCalledTimes(1);
    expect(nftsRefetch).not.toHaveBeenCalled();
  });
});
