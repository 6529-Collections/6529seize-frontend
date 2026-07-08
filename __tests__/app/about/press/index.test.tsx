import PressPage, { generateMetadata } from "@/app/about/press/page";
import { aboutPressMigratedWordPressPage } from "@/app/about/press/content";
import { render, screen } from "@testing-library/react";

describe("PressPage (migrated WordPress static page)", () => {
  it("renders the press title and first press item heading", () => {
    render(<PressPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "PRESS" })
    ).toBeInTheDocument();
    expect(screen.getByText("NFT100 LIST 2022")).toBeInTheDocument();
  });

  it("marks the page with its auditable migration source", () => {
    render(<PressPage />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("PRESS - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "PRESS - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(aboutPressMigratedWordPressPage.path).toBe("/about/press");
    expect(aboutPressMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
