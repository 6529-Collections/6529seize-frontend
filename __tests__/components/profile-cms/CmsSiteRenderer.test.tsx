import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import artMediaPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/art-media.package.json";
import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
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
const minimalPage = minimalCmsPackage.payload.pages[0];
const artPage = artCmsPackage.payload.pages[0];
if (!minimalPage || !artPage) {
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
});
