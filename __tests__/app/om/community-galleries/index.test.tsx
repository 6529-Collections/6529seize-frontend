import Page, { generateMetadata } from "@/app/om/community-galleries/page";
import { omCommunityGalleriesMigratedWordPressPage } from "@/app/om/community-galleries/content";
import { render, screen } from "@testing-library/react";

describe("OM Community Galleries Page (migrated WordPress static page)", () => {
  it("renders the community galleries title and gallery list content", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "OM COMMUNITY GALLERIES" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nude Neighborhood" })
    ).toHaveAttribute(
      "href",
      "https://oncyber.io/6529om?coords=509.39x2.8x953.66x-3.05"
    );
    expect(
      screen.getByRole("link", { name: "Korean Artists Collective" })
    ).toBeInTheDocument();
  });

  it("marks the page with its auditable migration source", () => {
    render(<Page />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("OM COMMUNITY GALLERIES - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "OM COMMUNITY GALLERIES - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(omCommunityGalleriesMigratedWordPressPage.path).toBe(
      "/om/community-galleries"
    );
    expect(omCommunityGalleriesMigratedWordPressPage.source).toBe(
      "migrated-wordpress"
    );
  });
});
