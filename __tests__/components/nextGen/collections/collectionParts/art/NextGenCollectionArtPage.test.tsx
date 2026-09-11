import React from "react";
import { render } from "@testing-library/react";
import NextGenCollectionArtPage from "@/components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage";
import type { NextGenCollection } from "@/entities/INextgen";

let headerProps: any = null;
let backLinkProps: any = null;
let artProps: any = null;

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    __esModule: true,
    default: (props: any) => {
      headerProps = props;
      return <div data-testid="header" />;
    },
    NextGenBackToCollectionPageLink: (props: any) => {
      backLinkProps = props;
      return <div data-testid="back-link" />;
    },
  })
);

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionArt",
  () => (props: any) => {
    artProps = props;
    return <div data-testid="art" />;
  }
);

jest.mock(
  "@/components/nextGen/collections/NextGenNavigationHeader",
  () => () => <div data-testid="nav" />
);

describe("NextGenCollectionArtPage", () => {
  beforeEach(() => {
    headerProps = null;
    backLinkProps = null;
    artProps = null;
  });

  it("renders navigation header and passes collection to child components", () => {
    const collection = { id: 1, name: "Cool" } as NextGenCollection;
    render(<NextGenCollectionArtPage collection={collection} />);
    expect(backLinkProps).toEqual({ collection });
    expect(headerProps).toEqual({
      collection,
      show_links: true,
      contained: false,
      compact: true,
    });
    expect(artProps).toEqual({ collection });
  });
});
