import Page, { generateMetadata } from "@/app/om/page";
import { omMigratedWordPressPage } from "@/app/om/content";
import { render, screen } from "@testing-library/react";

describe("OM Index Page (migrated WordPress static page)", () => {
  it("renders the OM title and district content", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "OM" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "DISTRICT 1 – 6529 MUSEUM DISTRICT",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Spring 2022/)).toHaveLength(2);
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

    expect(metadata.title).toBe("OM - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "OM - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(omMigratedWordPressPage.path).toBe("/om");
    expect(omMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
