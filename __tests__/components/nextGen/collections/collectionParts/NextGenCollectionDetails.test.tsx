import NextGenCollectionDetails from "@/components/nextGen/collections/collectionParts/NextGenCollectionDetails";
import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenCollectionView } from "@/types/enums";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionProvenance",
  () => ({ __esModule: true, default: () => <div data-testid="provenance" /> })
);
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenTraitSets",
  () => ({ __esModule: true, default: () => <div data-testid="traits" /> })
);

const collection = {
  name: "Test",
  description: "Desc",
  licence: "",
  artist_signature: "",
} as NextGenCollection;

describe("NextGenCollectionDetails", () => {
  it("renders provenance view", () => {
    render(
      <NextGenCollectionDetails
        collection={collection}
        view={NextgenCollectionView.PROVENANCE}
      />
    );
    expect(screen.getByTestId("provenance")).toBeInTheDocument();
  });

  it("renders overview view", () => {
    render(
      <NextGenCollectionDetails
        collection={collection}
        view={NextgenCollectionView.OVERVIEW}
      />
    );
    const overviewHeading = screen.getByText("Collection Overview");
    expect(overviewHeading).toBeInTheDocument();
    expect(overviewHeading.closest("section")).toHaveClass(
      "tw-bg-iron-900/80",
      "tw-p-4"
    );
    expect(screen.getByText("Desc")).toHaveClass("tw-text-sm", "tw-leading-6");
  });

  it("renders artist signature markup as text", () => {
    const artistSignature = '<img src=x onerror="alert(1)">0xsignature';
    const { container } = render(
      <NextGenCollectionDetails
        collection={{ ...collection, artist_signature: artistSignature }}
        view={NextgenCollectionView.OVERVIEW}
      />
    );

    expect(screen.getByText(artistSignature)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders trait sets view", () => {
    render(
      <NextGenCollectionDetails
        collection={collection}
        view={NextgenCollectionView.TOP_TRAIT_SETS}
      />
    );
    expect(screen.getByTestId("traits")).toBeInTheDocument();
  });
});
