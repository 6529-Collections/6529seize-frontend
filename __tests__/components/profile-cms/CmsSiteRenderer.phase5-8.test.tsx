import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import artMediaPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/art-media.package.json";
import collectionPagePackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/collection-page.package.json";
import exhibitionRoomPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";
import nftDetailPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/nft-detail.package.json";
import walletGalleryPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/wallet-gallery.package.json";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    readonly href: string;
    readonly children: ReactNode;
    readonly className?: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

const walletGalleryCmsPackage = walletGalleryPackage as unknown as CmsPackageV1;
const collectionCmsPackage = collectionPagePackage as unknown as CmsPackageV1;
const nftDetailCmsPackage = nftDetailPackage as unknown as CmsPackageV1;
const exhibitionRoomCmsPackage =
  exhibitionRoomPackage as unknown as CmsPackageV1;
const artMediaCmsPackage = artMediaPackage as unknown as CmsPackageV1;

describe("CmsSiteRenderer Phase 5-8 fixtures", () => {
  it("renders the generated wallet gallery home snapshot and featured routes", () => {
    renderFixturePage(walletGalleryCmsPackage, "page-gallery");

    expect(
      screen.getByRole("heading", { name: "Gallery", level: 1 })
    ).toBeInTheDocument();
    const gallerySection = getSectionByHeading("Wallet gallery");
    expect(within(gallerySection).getByText("2 wallets")).toBeInTheDocument();
    expect(within(gallerySection).getByText("22,000,000")).toBeInTheDocument();
    expect(
      within(gallerySection).getByText("Jun 17, 2026")
    ).toBeInTheDocument();

    const featuredLinks = within(gallerySection).getAllByRole("link");
    expect(featuredLinks.map((link) => link.getAttribute("href"))).toEqual(
      expect.arrayContaining([
        "/punk6529/collections/the-memes/index.html",
        "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html",
      ])
    );
  });

  it("renders the generated collection page contract and knowledge context", () => {
    renderFixturePage(collectionCmsPackage, "page-collection");

    expect(
      screen.getAllByRole("heading", {
        name: "The Memes by 6529",
      }).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(
        "Collection context fixture grounded in a knowledge packet."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Chain 1")).toBeInTheDocument();
    expect(
      screen.getByText("0x33fd426905f149f8376e227d0c9d3340aad17af1")
    ).toBeInTheDocument();
  });

  it("renders the NFT detail page with preserved artwork and token provenance", () => {
    renderFixturePage(nftDetailCmsPackage, "page-nft");

    expect(
      screen.getByAltText("The Memes by 6529 number 1 original artwork")
    ).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/bafyfixturenft/original.png"
    );
    expect(screen.getByText("Token #1")).toBeInTheDocument();
    expect(screen.getByText("Chain 1")).toBeInTheDocument();
    expect(
      screen.getByText("0x33fd426905f149f8376e227d0c9d3340aad17af1")
    ).toBeInTheDocument();
  });

  it("renders the 3D room fixture as an inspectable fallback linked to detail", () => {
    renderFixturePage(exhibitionRoomCmsPackage, "page-room");

    expect(screen.getByText("Simple Wall Room")).toBeInTheDocument();
    expect(
      screen.getByAltText("Poster for a simple 3D exhibition room")
    ).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/bafyfixtureroom/poster.jpg"
    );
    expect(
      screen.getByRole("link", { name: "Open source media" })
    ).toHaveAttribute(
      "href",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html"
    );
  });

  it("renders mixed art media with sandboxed embeds and object fallbacks", () => {
    renderFixturePage(artMediaCmsPackage, "page-home");

    expect(screen.getByTitle("Embedded profile website media")).toHaveAttribute(
      "sandbox",
      "allow-scripts"
    );
    expect(screen.getByText("3D object preview")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open source media" })
    ).toHaveAttribute(
      "href",
      "https://media.6529.io/ipfs/bafyfixturemedia/model.glb"
    );
  });
});

function renderFixturePage(cmsPackage: CmsPackageV1, pageId: string): void {
  const page = cmsPackage.payload.pages.find(
    (candidate) => candidate.id === pageId
  );
  if (!page) {
    throw new Error(`Missing CMS fixture page '${pageId}'.`);
  }

  render(<CmsSiteRenderer cmsPackage={cmsPackage} page={page} />);
}

function getSectionByHeading(name: string): HTMLElement {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("section");
  if (!section) {
    throw new Error(`Missing section for heading '${name}'.`);
  }
  return section;
}
