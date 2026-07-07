import { render, screen } from "@testing-library/react";

import MigratedWordPressArticlePage from "@/components/migrated-wordpress/MigratedWordPressArticlePage";
import type { MigratedWordPressArticleContent } from "@/components/migrated-wordpress/types";

const content = {
  source: "migrated-wordpress",
  path: "/blog/example",
  title: "Migrated Article",
  description: "A readable migrated article.",
  section: "Blog",
  author: {
    href: "https://example.com/author",
    label: "Author Name",
  },
  publishedAt: "2023-02-23T18:30:32+00:00",
  modifiedAt: "2023-03-16T19:43:46+00:00",
  readingTime: "4 minutes",
  heroImage: {
    src: "https://example.com/hero.jpg",
    alt: "Hero artwork",
    width: 800,
    height: 600,
  },
  blocks: [
    {
      type: "paragraph",
      content: "Opening paragraph.",
    },
    {
      type: "heading",
      content: "Section Heading",
    },
    {
      type: "image",
      media: {
        src: "https://example.com/image.gif",
        alt: "Animated example",
        width: 400,
        height: 400,
        caption: "Animation caption",
      },
    },
    {
      type: "video",
      video: {
        src: "https://example.com/video.mp4",
        title: "Article video",
        caption: "Video caption",
      },
    },
    {
      type: "quote",
      content: "Quoted post.",
      cite: "Quote author",
    },
  ],
} satisfies MigratedWordPressArticleContent;

describe("MigratedWordPressArticlePage", () => {
  it("renders migrated WordPress article content with an auditable source marker", () => {
    const { container } = render(
      <MigratedWordPressArticlePage content={content} />
    );

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Migrated Article" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("A readable migrated article.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Author Name" })).toHaveAttribute(
      "href",
      "https://example.com/author"
    );
    expect(screen.getByText("February 23, 2023")).toBeInTheDocument();
    expect(screen.getByText("4 minutes")).toBeInTheDocument();
    expect(screen.getByAltText("Hero artwork")).toHaveAttribute(
      "src",
      "https://example.com/hero.jpg"
    );
    expect(screen.getByAltText("Animated example")).toHaveAttribute(
      "src",
      "https://example.com/image.gif"
    );
    expect(screen.getByText("Animation caption")).toBeInTheDocument();
    expect(screen.getByLabelText("Article video")).toBeInTheDocument();
    expect(screen.getByText("Video caption")).toBeInTheDocument();
    expect(screen.getByText("Quoted post.")).toBeInTheDocument();
    expect(screen.getByText("Quote author")).toBeInTheDocument();

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveTextContent(
      "Sorry, your browser does not support embedded videos."
    );
  });
});
