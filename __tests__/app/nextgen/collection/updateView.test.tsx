import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import NextGenCollectionPageClient from "@/app/nextgen/collection/[collection]/[[...view]]/NextGenCollectionPageClient";
import { render } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

let setViewFn: any;
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

jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: () => jest.fn() }));

describe("NextGenCollectionPageClient updateView", () => {
  it("pushes new url when view changes", () => {
    render(
      <NextGenCollectionPageClient
        collection={{ name: "Cool" } as any}
        view={ContentView.OVERVIEW}
      />
    );
    setViewFn(ContentView.PROVENANCE);
    expect(push).toHaveBeenCalledWith(
      "/nextgen/collection/cool/provenance"
    );
  });
});
