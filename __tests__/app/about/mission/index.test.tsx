import MissionPage, { generateMetadata } from "@/app/about/mission/page";
import { aboutMissionMigratedWordPressPage } from "@/app/about/mission/content";
import { render, screen } from "@testing-library/react";

describe("MissionPage (migrated WordPress static page)", () => {
  it("renders the mission title and statement from the content module", () => {
    render(<MissionPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "6529 MISSION" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /THE 6529 MISSION IS TO ACCELERATE THE DEVELOPMENT OF AN OPEN METAVERSE/
      ).length
    ).toBeGreaterThan(0);
  });

  it("marks the page with its auditable migration source", () => {
    render(<MissionPage />);

    expect(document.querySelector("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
  });

  it("exposes title, description, and Open Graph via generateMetadata", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("6529 MISSION - 6529.io");
    expect(metadata.description).toBe(
      "THE 6529 MISSION IS TO ACCELERATE THE DEVELOPMENT OF AN OPEN METAVERSE | 6529.io"
    );
    expect(metadata.openGraph).toMatchObject({
      siteName: "6529.io",
      title: "6529 MISSION - 6529.io",
    });
  });

  it("keeps the content module aligned with the page path", () => {
    expect(aboutMissionMigratedWordPressPage.path).toBe("/about/mission");
    expect(aboutMissionMigratedWordPressPage.source).toBe("migrated-wordpress");
  });
});
