import PodcastsPage, { generateMetadata } from "@/app/education/podcasts/page";
import { educationPodcastsMigratedWordPressPage } from "@/app/education/podcasts/content";
import { render, screen } from "@testing-library/react";

describe("PodcastsPage (migrated WordPress static page)", () => {
  it("renders the podcasts title from the content module", () => {
    render(<PodcastsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "PODCASTS" })
    ).toBeInTheDocument();
  });

  it("marks the page with its auditable migration source", () => {
    render(<PodcastsPage />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title and Open Graph metadata via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("PODCASTS - 6529.io");
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "PODCASTS - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(educationPodcastsMigratedWordPressPage.path).toBe(
      "/education/podcasts"
    );
    expect(educationPodcastsMigratedWordPressPage.source).toBe(
      "migrated-wordpress"
    );
  });
});
