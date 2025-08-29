import NextGenCollectionPageClient from "@/app/nextgen/collection/[collection]/[[...view]]/NextGenCollectionPageClient";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { render } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// No-op the redirect hook so it doesn't interfere
jest.mock("@/app/nextgen/collection/[collection]/useShallowRedirect", () => ({
  useShallowRedirect: () => {},
}));

// Mock the heavy child to capture setView
let setViewFn: (v: ContentView) => void;
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollection",
  () => {
    const actual = jest.requireActual(
      "@/components/nextGen/collections/collectionParts/NextGenCollection"
    );
    return {
      __esModule: true,
      ...actual,
      default: (props: any) => {
        setViewFn = props.setView;
        return <div data-testid="collection" />;
      },
    };
  }
);

// Instead of wrapping with TitleProvider, just mock useTitle to avoid context
jest.mock("@/contexts/TitleContext", () => {
  const actual = jest.requireActual("@/contexts/TitleContext");
  return {
    __esModule: true,
    ...actual, // keeps TitleProvider available if you want it
    useTitle: () => ({ setTitle: jest.fn() }),
  };
});

describe("NextGenCollectionPageClient updateView", () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Only used in the effect deps; return a stable object
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => "",
      entries: function* () {},
      keys: function* () {},
      values: function* () {},
      has: () => false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("pushes new url when view changes to non-overview view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Cool Collection" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    // Simulate child requesting a view change
    setViewFn(ContentView.PROVENANCE);

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/cool-collection/provenance",
      { scroll: false }
    );
  });

  it("pushes overview url when view changes to OVERVIEW", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Cool Collection" } as any}
        view={ContentView.PROVENANCE}
      />
    );

    // Simulate child requesting a view change to overview
    setViewFn(ContentView.OVERVIEW);

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/cool-collection/",
      { scroll: false }
    );
  });

  it("handles collection names with special characters in URL generation", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "My Amazing NFT Collection!" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    // Simulate child requesting a view change
    setViewFn(ContentView.RARITY);

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/my-amazing-nft-collection!/rarity",
      { scroll: false }
    );
  });

  it("handles different content view types correctly", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Test Collection" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    // Test ABOUT view
    setViewFn(ContentView.ABOUT);
    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/test-collection/about",
      { scroll: false }
    );

    mockPush.mockClear();

    // Test DISPLAY_CENTER view (contains spaces and underscore-like words)
    setViewFn(ContentView.DISPLAY_CENTER);
    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/test-collection/display-center",
      { scroll: false }
    );

    mockPush.mockClear();

    // Test TOP_TRAIT_SETS view (contains underscore)
    setViewFn(ContentView.TOP_TRAIT_SETS);
    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/test-collection/top-trait-sets",
      { scroll: false }
    );
  });
});
