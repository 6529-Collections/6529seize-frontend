import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import artMediaPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/art-media.package.json";
import collectionPagePackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/collection-page.package.json";
import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
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

const minimalCmsPackage = minimalPackage as unknown as CmsPackageV1;
const artCmsPackage = artMediaPackage as unknown as CmsPackageV1;
const collectionCmsPackage = collectionPagePackage as unknown as CmsPackageV1;
const nftDetailCmsPackage = nftDetailPackage as unknown as CmsPackageV1;
const walletGalleryCmsPackage = walletGalleryPackage as unknown as CmsPackageV1;
const minimalPage = minimalCmsPackage.payload.pages[0];
const artPage = artCmsPackage.payload.pages[0];
const collectionPage = collectionCmsPackage.payload.pages.find(
  (page) => page.id === "page-collection"
);
const nftDetailPage = nftDetailCmsPackage.payload.pages.find(
  (page) => page.id === "page-nft"
);
const walletGalleryPage = walletGalleryCmsPackage.payload.pages.find(
  (page) => page.id === "page-gallery"
);
const walletNftPage2 = walletGalleryCmsPackage.payload.pages.find(
  (page) => page.id === "page-nft-2"
);
if (
  !minimalPage ||
  !artPage ||
  !collectionPage ||
  !nftDetailPage ||
  !walletGalleryPage ||
  !walletNftPage2
) {
  throw new Error("Expected CMS fixture pages.");
}

describe("CmsSiteRenderer", () => {
  it("renders V1 page metadata, navigation, headings, and rich text", () => {
    render(
      <CmsSiteRenderer cmsPackage={minimalCmsPackage} page={minimalPage} />
    );

    expect(
      screen.getByRole("navigation", { name: "punk6529 navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/punk6529/index.html"
    );
    expect(
      screen.getAllByRole("heading", { name: "punk6529", level: 1 })
    ).toHaveLength(2);
    expect(
      screen.getByText(
        "This is the smallest valid profile CMS homepage fixture."
      )
    ).toBeInTheDocument();
  });

  it("renders sandboxed embeds without package-controlled srcdoc or same-origin", () => {
    const htmlBlockIndex = artPage.blocks.findIndex(
      (block) => block.block_type === "html_embed"
    );
    const htmlBlock = artPage.blocks[htmlBlockIndex];
    if (!htmlBlock) {
      throw new Error("Expected html_embed fixture block.");
    }

    const cmsPackage: CmsPackageV1 = {
      ...artCmsPackage,
      payload: {
        ...artCmsPackage.payload,
        pages: [
          {
            ...artPage,
            blocks: [
              {
                ...htmlBlock,
                srcdoc: "<script>alert(1)</script>",
                interactive_policy: {
                  ...htmlBlock.interactive_policy,
                  sandbox_permissions: ["allow-scripts", "allow-same-origin"],
                },
              },
            ],
          },
        ],
      },
    };

    render(
      <CmsSiteRenderer
        cmsPackage={cmsPackage}
        page={cmsPackage.payload.pages[0] ?? artPage}
      />
    );

    const iframe = screen.getByTitle("Embedded profile website media");
    expect(iframe).toHaveAttribute(
      "src",
      "https://media.6529.io/ipfs/bafyfixturemedia/index.html"
    );
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    expect(iframe).not.toHaveAttribute("srcdoc");
  });

  it("renders contact-sheet art grids with keyboard lightbox inspection", async () => {
    const user = userEvent.setup();
    render(
      <CmsSiteRenderer
        cmsPackage={collectionCmsPackage}
        page={collectionPage}
      />
    );

    expect(screen.getByText("Collection contact sheet")).toBeInTheDocument();
    const firstWork = screen.getByRole("button", {
      name: "Inspect: The Memes by 6529 card number 1",
    });

    await user.click(firstWork);

    const dialog = screen.getByRole("dialog", {
      name: "The Memes by 6529 card number 1",
    });
    expect(dialog).toBeInTheDocument();
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();

    const metadataButton = screen.getByRole("button", {
      name: "Show metadata",
    });
    await user.click(metadataButton);
    expect(screen.getByText("Media metadata")).toBeInTheDocument();
    expect(screen.getAllByText("Original asset").length).toBeGreaterThan(0);
    await user.keyboard("m");
    expect(screen.getByText("Media metadata")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("heading", {
        name: "Tall derivative for The Memes by 6529 card number 2",
      })
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(firstWork).toHaveFocus();

    await user.click(firstWork);
    await user.click(
      screen.getByRole("dialog", {
        name: "The Memes by 6529 card number 1",
      })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders NFT detail pages with art-first media, traits, provenance, and related context", () => {
    render(
      <CmsSiteRenderer cmsPackage={nftDetailCmsPackage} page={nftDetailPage} />
    );

    expect(
      screen.getByRole("button", {
        name: "Inspect: The Memes #1",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Original asset")).toBeInTheDocument();
    expect(screen.getByText("Traits")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("Open Metaverse")).toBeInTheDocument();
    expect(screen.getByText("Provenance")).toBeInTheDocument();
    expect(screen.getAllByText("Metadata URI")).not.toHaveLength(0);
    expect(
      screen.getAllByText("0x33fd426905f149f8376e227d0c9d3340aad17af1")
    ).not.toHaveLength(0);
    expect(
      screen.getAllByRole("link", { name: "The Memes by 6529" }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Related works")).toBeInTheDocument();
    expect(screen.getByText("Package details")).toBeInTheDocument();
  });

  it("renders generated wallet galleries as visual featured-page grids", () => {
    render(
      <CmsSiteRenderer
        cmsPackage={walletGalleryCmsPackage}
        page={walletGalleryPage}
      />
    );

    expect(screen.getByText("Editorial grid")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The Memes #1" })).toHaveAttribute(
      "href",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/1/index.html"
    );
    expect(screen.getByRole("link", { name: "The Memes #2" })).toHaveAttribute(
      "href",
      "/punk6529/nfts/ethereum/0x33fd426905f149f8376e227d0c9d3340aad17af1/2/index.html"
    );
    expect(
      screen.getByRole("button", {
        name: "Inspect: The Memes #2",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Grid derivative for The Memes by 6529 card number 2")
    ).toBeInTheDocument();
  });

  it("resolves multi-profile NFT detail pages from route paths when blocks omit profile ids", () => {
    const pageWithoutProfileId = {
      ...walletNftPage2,
      blocks: walletNftPage2.blocks.map((block) => {
        if (block.block_type !== "nft_reference") {
          return block;
        }

        const { nft_media_profile_id: _nftMediaProfileId, ...rest } =
          block as Record<string, unknown>;
        return rest as typeof block;
      }),
    };
    const cmsPackage: CmsPackageV1 = {
      ...walletGalleryCmsPackage,
      payload: {
        ...walletGalleryCmsPackage.payload,
        pages: walletGalleryCmsPackage.payload.pages.map((page) =>
          page.id === pageWithoutProfileId.id ? pageWithoutProfileId : page
        ),
      },
    };

    render(
      <CmsSiteRenderer cmsPackage={cmsPackage} page={pageWithoutProfileId} />
    );

    expect(
      screen.getByRole("button", {
        name: "Inspect: The Memes #2",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Provenance")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.queryByText("NFT reference unavailable")).toBeNull();
  });

  it("rejects unsafe package URI schemes before rendering CMS links", () => {
    expect(resolveCmsUri("javascript:alert(1)")).toBeNull();
    expect(resolveCmsUri("data:text/html,<svg></svg>")).toBeNull();
  });

  it("renders audio media with poster fallback and caption transcript text", () => {
    render(<CmsSiteRenderer cmsPackage={artCmsPackage} page={artPage} />);

    expect(
      screen.getByText(
        "Audio artwork transcript placeholder for mixed media fixture"
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: "Inspect: Poster fallback for mixed media artwork",
      }).length
    ).toBeGreaterThan(0);
  });

  it("does not iframe arbitrary external html embed origins", () => {
    const htmlBlock = artPage.blocks.find(
      (block) => block.block_type === "html_embed"
    );
    if (!htmlBlock) {
      throw new Error("Expected html_embed fixture block.");
    }

    const cmsPackage: CmsPackageV1 = {
      ...artCmsPackage,
      payload: {
        ...artCmsPackage.payload,
        assets: [
          {
            id: "external-html",
            kind: "html",
            uri: "https://example.com/embed.html",
            roles: ["detail"],
          },
        ],
        pages: [
          {
            ...artPage,
            blocks: [
              {
                ...htmlBlock,
                asset_id: "external-html",
              },
            ],
          },
        ],
      },
    };

    render(
      <CmsSiteRenderer
        cmsPackage={cmsPackage}
        page={cmsPackage.payload.pages[0] ?? artPage}
      />
    );

    expect(screen.queryByTitle("Embedded profile website media")).toBeNull();
    expect(screen.getByText("Embedded media preview")).toBeInTheDocument();
  });

  it("shows a safe fallback for unknown future block types", () => {
    const cmsPackage: CmsPackageV1 = {
      ...minimalCmsPackage,
      payload: {
        ...minimalCmsPackage.payload,
        pages: [
          {
            ...minimalPage,
            blocks: [
              {
                id: "block-future",
                block_type: "future_block",
              } as unknown as CmsPackageV1["payload"]["pages"][number]["blocks"][number],
            ],
          },
        ],
      },
    };

    render(
      <CmsSiteRenderer
        cmsPackage={cmsPackage}
        page={cmsPackage.payload.pages[0] ?? minimalPage}
      />
    );

    expect(screen.getByText("Unsupported block")).toBeInTheDocument();
  });

  it("uses a readable fallback label for unknown future page types", () => {
    const futurePage = {
      ...minimalPage,
      type: "future_page" as CmsPackageV1["payload"]["pages"][number]["type"],
      blocks: [],
    };

    render(
      <CmsSiteRenderer cmsPackage={minimalCmsPackage} page={futurePage} />
    );

    expect(screen.getByText("future page")).toBeInTheDocument();
  });
});
