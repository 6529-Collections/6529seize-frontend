import { useNftMarketRoute } from "@/hooks/useNftMarketRoute";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { renderHook } from "@testing-library/react";

jest.mock("@/hooks/useNftPurchasingVisibility");

describe("useNftMarketRoute", () => {
  afterEach(() => globalThis.history.replaceState(null, "", "/"));

  it.each([
    {
      url: "/the-memes/1?focus=listings-and-offers&order=id&locale=fr-FR#art",
      destination: undefined,
      expected: "/the-memes/1?locale=fr-FR#art",
    },
    {
      url: "/nextgen/token/10000000000/listings-and-offers?order=id&locale=fr-FR",
      destination: "/nextgen/token/10000000000",
      expected: "/nextgen/token/10000000000?locale=fr-FR",
    },
  ])("opens artwork on iOS from $url", ({ url, destination, expected }) => {
    jest.mocked(useNftPurchasingVisibility).mockReturnValue({
      hideNftPurchasing: true,
      shouldRedirect: true,
      reservesNftPurchasingSpace: false,
    });
    globalThis.history.replaceState(null, "", url);
    const marketUrl = new URL(globalThis.location.href);

    const { result } = renderHook(() =>
      useNftMarketRoute(marketUrl.pathname, marketUrl.searchParams, destination)
    );

    expect(result.current.redirectToArtwork).toBe(true);
    const { pathname, search, hash } = globalThis.location;
    expect(pathname + search + hash).toBe(expected);
  });

  it("keeps web market links and their order IDs", () => {
    jest.mocked(useNftPurchasingVisibility).mockReturnValue({
      hideNftPurchasing: false,
      shouldRedirect: false,
      reservesNftPurchasingSpace: false,
    });
    const url = "/the-memes/1?focus=listings-and-offers&order=id";
    globalThis.history.replaceState(null, "", url);
    const marketUrl = new URL(globalThis.location.href);

    const { result } = renderHook(() =>
      useNftMarketRoute(marketUrl.pathname, marketUrl.searchParams)
    );

    expect(result.current.redirectToArtwork).toBe(false);
    expect(globalThis.location.pathname + globalThis.location.search).toBe(url);
  });
});
