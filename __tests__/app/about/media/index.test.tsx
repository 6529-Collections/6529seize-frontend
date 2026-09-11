import MediaPage, { generateMetadata } from "@/app/about/media/page";
import { aboutMediaMigratedWordPressPage } from "@/app/about/media/content";
import { render, screen } from "@testing-library/react";

describe("MediaPage (migrated WordPress static page)", () => {
  it("renders the media center title and brand collateral links", () => {
    render(<MediaPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "MEDIA CENTER" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Official brand collateral for use in publications is below:"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Punk with background")).toHaveAttribute(
      "href",
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Punk6529.png"
    );
    expect(
      screen.getByRole("link", { name: "support@6529.io" })
    ).toHaveAttribute("href", "mailto:support@6529.io");
  });

  it("marks the page with its auditable migration source", () => {
    render(<MediaPage />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("MEDIA CENTER - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "MEDIA CENTER - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(aboutMediaMigratedWordPressPage.path).toBe("/about/media");
    expect(aboutMediaMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
