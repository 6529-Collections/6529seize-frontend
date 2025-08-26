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
  it("pushes new url when view changes", () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });

    // Only used in the effect deps; return a stable object
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => "",
      entries: function* () {},
      keys: function* () {},
      values: function* () {},
      has: () => false,
    });

    render(
      // You can wrap with TitleProvider if you like; not required due to mocked useTitle
      <NextGenCollectionPageClient
        collection={{ name: "Cool" } as any}
        view={ContentView.OVERVIEW}
      />
    );

    // Simulate child requesting a view change
    setViewFn(ContentView.PROVENANCE);

    expect(replace).toHaveBeenCalledWith(
      "/nextgen/collection/cool/provenance",
      { scroll: false }
    );
  });
});
