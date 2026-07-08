import NewsPage, { generateMetadata } from "@/app/category/news/page";
import { categoryNewsMigratedWordPressPage } from "@/app/category/news/content";
import { render, screen } from "@testing-library/react";

describe("NewsPage (migrated WordPress static page)", () => {
  it("renders the news archive title and announcement content", () => {
    render(<NewsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "NEWS" })
    ).toBeInTheDocument();
    expect(screen.getByText("6529 News and Announcements")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "INTRODUCING OM" })
    ).toBeInTheDocument();
  });

  it("marks the page with its auditable migration source", () => {
    render(<NewsPage />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("NEWS - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "NEWS - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(categoryNewsMigratedWordPressPage.path).toBe("/category/news");
    expect(categoryNewsMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
