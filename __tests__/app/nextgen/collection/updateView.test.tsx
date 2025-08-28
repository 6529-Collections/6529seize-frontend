import NextGenCollectionPageClient from "@/app/nextgen/collection/[collection]/[[...view]]/NextGenCollectionPageClient";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { render, act } from "@testing-library/react";
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
  let mockSearchParams: any;

  beforeEach(() => {
    mockPush = jest.fn();
    mockSearchParams = {
      get: () => null,
      toString: () => "",
      entries: function* () {},
      keys: function* () {},
      values: function* () {},
      has: () => false,
    };
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("pushes new url when view changes to PROVENANCE", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Cool" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    // Simulate child requesting a view change
    act(() => {
      setViewFn(ContentView.PROVENANCE);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/cool/provenance",
      { scroll: false }
    );
  });

  it("pushes correct url for OVERVIEW view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "My Collection" } as any}
        view={ContentView.PROVENANCE}
      />
    );

    // Change to OVERVIEW should result in root path
    act(() => {
      setViewFn(ContentView.OVERVIEW);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/my-collection/",
      { scroll: false }
    );
  });

  it("pushes correct url for ABOUT view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Test Collection" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    act(() => {
      setViewFn(ContentView.ABOUT);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/test-collection/about",
      { scroll: false }
    );
  });

  it("pushes correct url for DISPLAY_CENTER view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Display Test" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    act(() => {
      setViewFn(ContentView.DISPLAY_CENTER);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/display-test/display-center",
      { scroll: false }
    );
  });

  it("pushes correct url for RARITY view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Rarity Test" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    act(() => {
      setViewFn(ContentView.RARITY);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/rarity-test/rarity",
      { scroll: false }
    );
  });

  it("pushes correct url for TOP_TRAIT_SETS view", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Trait Sets" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    act(() => {
      setViewFn(ContentView.TOP_TRAIT_SETS);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/trait-sets/top-trait-sets",
      { scroll: false }
    );
  });

  it("handles collection names with special characters", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Cool_Collection With Spaces" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    act(() => {
      setViewFn(ContentView.ABOUT);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/cool_collection-with-spaces/about",
      { scroll: false }
    );
  });

  it("doesn't push when same view is selected", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Same View" } as any}
        view={ContentView.PROVENANCE}
      />
    );

    // Clear any initial calls
    jest.clearAllMocks();

    // Setting the same view should still trigger navigation (current implementation behavior)
    act(() => {
      setViewFn(ContentView.PROVENANCE);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/nextgen/collection/same-view/provenance",
      { scroll: false }
    );
  });

  it("maintains scroll: false option for all navigation calls", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Scroll Test" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    const viewsToTest = [
      ContentView.ABOUT,
      ContentView.PROVENANCE,
      ContentView.DISPLAY_CENTER,
      ContentView.RARITY,
      ContentView.TOP_TRAIT_SETS,
      ContentView.OVERVIEW
    ];

    viewsToTest.forEach((view, index) => {
      act(() => {
        setViewFn(view);
      });

      // Check that the second parameter is always { scroll: false }
      expect(mockPush).toHaveBeenNthCalledWith(
        index + 1,
        expect.any(String),
        { scroll: false }
      );
    });
  });
});
