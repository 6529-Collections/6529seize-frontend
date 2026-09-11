import { fireEvent, render, screen, within } from "@testing-library/react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { createRendererContext } from "@/components/profile-cms/site-renderer/data";
import { createArtInspectionItem } from "@/components/profile-cms/site-renderer/media";
import {
  CMS_STUDIO_TEMPLATES,
  instantiateCmsStudioTemplate,
} from "@/lib/profile-cms/studio/templates";
import { getCmsStudioPresentation } from "@/lib/profile-cms/studio/presentation";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const fixture = (id = "signature") =>
  instantiateCmsStudioTemplate(
    id,
    "example6529",
    new Date("2026-09-10T12:00:00Z")
  );

describe("CMS studio public rendering", () => {
  it.each(CMS_STUDIO_TEMPLATES.map((template) => template.id))(
    "renders %s with a single page title and readable navigation",
    (id) => {
      const document = fixture(id);
      const page = document.payload.pages[0]!;
      render(
        <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
      );
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        page.metadata.title
      );
      const navigation = screen.getByRole("navigation");
      for (const link of within(navigation).getAllByRole("link")) {
        expect(link.getAttribute("href")).toMatch(/^\/example6529\/[^.]+$/);
      }
      expect(
        screen.getAllByRole("link", { name: /@example6529 on 6529/ })
      ).toHaveLength(2);
    }
  );

  it("follows the declared homepage rather than array order", () => {
    const document = fixture();
    const home = document.payload.pages[0]!;
    document.payload.pages.reverse();
    render(
      <CmsSiteRenderer cmsPackage={document} page={home} locale="en-US" />
    );
    expect(screen.getByRole("link", { name: "Mira" })).toHaveAttribute(
      "href",
      "/example6529/studio"
    );
  });

  it("only opts into studio rendering with an explicit revision", () => {
    const document = fixture();
    document.site.theme.tokens = { studio_layout: "gallery" };
    expect(getCmsStudioPresentation(document)).toBeNull();
  });

  it("selects sections and changes preview pages without navigating away", () => {
    const document = fixture();
    const page = document.payload.pages[0]!;
    const select = jest.fn();
    const navigate = jest.fn();
    render(
      <CmsSiteRenderer
        cmsPackage={document}
        page={page}
        locale="en-US"
        editing={{ onSelectBlock: select, onNavigatePage: navigate }}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: `Edit ${page.metadata.title}` })
    );
    expect(select).toHaveBeenCalledWith(page.blocks[0]!.id);
    fireEvent.click(
      within(screen.getByRole("navigation")).getByRole("link", {
        name: "About",
      })
    );
    expect(navigate).toHaveBeenCalledWith("page-about");
  });

  it("uses a static Meme preview while preserving the original in the inspector", () => {
    const document = fixture("meme-after-hours");
    const page = document.payload.pages[0]!;
    const asset = document.payload.assets.find(
      (item) => item.mime_type === "image/gif"
    )!;
    expect(asset).toBeDefined();
    const originalHash = asset.content_hash;
    const original = createArtInspectionItem({
      asset,
      context: createRendererContext(document, "en-US"),
      title: asset.alt_text,
    });
    const { container } = render(
      <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
    );
    const thumbnail = screen.getByRole("img", { name: asset.alt_text! });
    expect(decodeURIComponent(thumbnail.getAttribute("src")!)).toContain(
      "/profile-cms/templates/memes/5.webp"
    );
    fireEvent.click(thumbnail.closest("button")!);
    expect(container.querySelector("dialog img")).toHaveAttribute(
      "src",
      original!.src
    );
    expect(
      document.payload.assets.find((item) => item.id === asset.id)!.content_hash
    ).toBe(originalHash);
  });

  it("escapes authored markup and refuses executable link destinations", () => {
    const document = fixture();
    const page = document.payload.pages[0]!;
    const unsafeBlocks = [
      {
        id: "unsafe-text",
        block_type: "rich_text" as const,
        content: '<img src=x onerror="alert(1)">',
      },
      {
        id: "unsafe-link",
        block_type: "button_link" as const,
        label: "Unsafe destination",
        href: "javascript:alert(1)",
      },
    ];
    page.blocks = unsafeBlocks;
    const { container } = render(
      <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
    );
    expect(
      screen.getByText('<img src=x onerror="alert(1)">')
    ).toBeInTheDocument();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Unsafe destination" })
    ).not.toBeInTheDocument();
  });
});
