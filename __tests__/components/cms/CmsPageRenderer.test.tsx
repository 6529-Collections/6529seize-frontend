import { render, screen } from "@testing-library/react";

import CmsPageRenderer from "@/components/cms/public/CmsPageRenderer";
import { cmsFixturePackages } from "@/lib/cms/fixtures";
import type { CmsPublishedPackage } from "@/lib/cms/types";

describe("CmsPageRenderer", () => {
  it("renders a wallet gallery package from fixture data", () => {
    render(<CmsPageRenderer cmsPackage={cmsFixturePackages.gallery} />);

    expect(
      screen.getByRole("heading", { name: "Collected Signals" })
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet gallery snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("The Memes").length).toBeGreaterThan(0);
    expect(screen.getByText("6529 Gradients")).toBeInTheDocument();
    expect(screen.getByLabelText("CMS package evidence")).toHaveTextContent(
      cmsFixturePackages.gallery.package_hash
    );
  });

  it("renders transaction references as explained chain evidence", () => {
    render(<CmsPageRenderer cmsPackage={cmsFixturePackages.transaction} />);

    expect(
      screen.getByRole("heading", {
        name: "A transaction page should explain the event first",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The wallet transferred a 6529 Meme Card to a new collecting wallet and paid normal Ethereum gas."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Transferred The Memes token #1.")
    ).toBeInTheDocument();
  });

  it("renders unsafe package URLs as inert content", () => {
    const unsafePackage: CmsPublishedPackage = {
      ...cmsFixturePackages.gallery,
      payload: {
        ...cmsFixturePackages.gallery.payload,
        assets: [
          {
            ...cmsFixturePackages.gallery.payload.assets[0],
            src: "javascript:alert(1)",
          },
        ],
        blocks: [
          {
            id: "unsafe-button",
            type: "button_link",
            label: "Unsafe action",
            href: "javascript:alert(1)",
          },
          {
            id: "unsafe-gallery",
            type: "gallery",
            items: [
              {
                asset_id: cmsFixturePackages.gallery.payload.assets[0].id,
                title: "Unsafe gallery item",
                href: "data:text/html,<h1>x</h1>",
              },
            ],
          },
          {
            id: "unsafe-wallet-gallery",
            type: "generated_wallet_gallery",
            title: "Unsafe wallet gallery",
            wallets: ["0xA4F6f8A1c2B3d4E5f60718293aBcDEF123456789"],
            snapshot: { captured_at: "2026-06-16T00:00:00.000Z" },
            stats: [{ label: "Collections", value: "1" }],
            collections: [
              {
                title: "Unsafe collection",
                count: 1,
                asset_id: cmsFixturePackages.gallery.payload.assets[0].id,
                href: "javascript:alert(2)",
              },
            ],
          },
        ],
      },
    };

    render(<CmsPageRenderer cmsPackage={unsafePackage} />);

    expect(screen.queryByRole("link", { name: "Unsafe action" })).toBeNull();
    expect(screen.getByText("Unsafe action")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByText("Unsafe gallery item").closest("a")).toBeNull();
    expect(screen.getByText("Unsafe collection").closest("a")).toBeNull();
    expect(screen.getAllByRole("img")[0]).toHaveAttribute("src", "/6529io.png");
  });

  it("keeps package-authored headings below the page title level", () => {
    const h1BlockPackage: CmsPublishedPackage = {
      ...cmsFixturePackages.gallery,
      payload: {
        ...cmsFixturePackages.gallery.payload,
        blocks: [
          {
            id: "package-heading",
            type: "heading",
            level: 1,
            text: "Package supplied heading",
          },
        ],
      },
    };

    render(<CmsPageRenderer cmsPackage={h1BlockPackage} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Package supplied heading",
      })
    ).toBeInTheDocument();
  });

  it("renders duplicate rich text, facts, and actions without key collisions", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const duplicateContentPackage: CmsPublishedPackage = {
      ...cmsFixturePackages.gallery,
      payload: {
        ...cmsFixturePackages.gallery.payload,
        blocks: [
          {
            id: "duplicate-copy",
            type: "rich_text",
            paragraphs: ["Repeated", "Repeated"],
          },
          {
            id: "duplicate-actions",
            type: "transaction_reference",
            chain_id: 1,
            hash: "0x6529652965296529652965296529652965296529652965296529652965296529",
            block_number: 22500000,
            timestamp: "2026-06-16T00:00:00.000Z",
            summary: "Duplicate content should still render cleanly.",
            from: "0x0000000000000000000000000000000000006529",
            to: "0x0000000000000000000000000000000000000001",
            value_eth: "0",
            actions: ["Same action", "Same action"],
          },
        ],
      },
    };

    render(<CmsPageRenderer cmsPackage={duplicateContentPackage} />);

    expect(screen.getAllByText("Repeated")).toHaveLength(2);
    expect(screen.getAllByText("Same action")).toHaveLength(2);
    expect(
      errorSpy.mock.calls.some(([message]) =>
        String(message).includes("Encountered two children with the same key")
      )
    ).toBe(false);
    errorSpy.mockRestore();
  });
});
