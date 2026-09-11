import Page, { generateMetadata } from "@/app/om/6529-museum-district/page";
import { om_6529MuseumDistrictMigratedWordPressPage } from "@/app/om/6529-museum-district/content";
import { render, screen } from "@testing-library/react";

describe("6529 Museum District Page (migrated WordPress static page)", () => {
  it("renders the district title and core description", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "6529 MUSEUM DISTRICT" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the leading educational and onboarding start/i)
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

    expect(metadata.title).toBe("6529 MUSEUM DISTRICT - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "6529 MUSEUM DISTRICT - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(om_6529MuseumDistrictMigratedWordPressPage.path).toBe(
      "/om/6529-museum-district"
    );
    expect(om_6529MuseumDistrictMigratedWordPressPage.source).toBe(
      "migrated-wordpress"
    );
  });
});
