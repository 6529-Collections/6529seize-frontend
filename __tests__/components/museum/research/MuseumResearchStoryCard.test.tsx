import { render, screen } from "@testing-library/react";
import { MuseumResearchStoryCard } from "@/components/museum/research/MuseumResearchStoryCard";

describe("MuseumResearchStoryCard", () => {
  it("uses the title when reviewed media has blank alternative text", () => {
    render(
      <MuseumResearchStoryCard
        href="/museum/network/research/a-study"
        eyebrow="Featured study"
        title="A study of a work"
        description="A close reading."
        actionLabel="Read the study"
        media={{
          id: "media-1",
          artworkId: "work-1",
          kind: "still",
          role: "source",
          mediaType: "image/jpeg",
          width: 1200,
          height: 900,
          altText: "   ",
          credit: {
            creditLine: "Museum publication record",
            licenseLabel: "CC BY-NC 4.0",
            licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
            rightsExpressionId: "cc-by-nc-4.0",
            sourcePath: "records/media/media-1.json",
          },
          sourcePath: "records/media/media-1.json",
          custody: "retained",
          url: "https://example.com/work.jpg",
          preservationStatus: "retained_verified",
          sha256: `sha256:${"a".repeat(64)}`,
          upstreamProvider: null,
        }}
      />
    );

    expect(
      screen.getByRole("img", { name: "A study of a work" })
    ).toBeInTheDocument();
  });
});
