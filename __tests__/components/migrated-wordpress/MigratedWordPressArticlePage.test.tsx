import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import { render, screen } from "@testing-library/react";

import MigratedWordPressArticlePage from "@/components/migrated-wordpress/MigratedWordPressArticlePage";
import MigratedWordPressStaticPage from "@/components/migrated-wordpress/MigratedWordPressStaticPage";
import type {
  MigratedWordPressArticleContent,
  MigratedWordPressStaticPageContent,
} from "@/components/migrated-wordpress/types";

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
    {
      type: "html",
      // Trusted in-repo literal; the renderer injects it unsanitized by contract.
      html: migratedWordPressTrustedHtml(
        '<p>Trusted <strong>rich</strong> copy with <a href="/about">a link</a>.</p>'
      ),
    },
    {
      type: "divider",
    },
  ],
} satisfies MigratedWordPressArticleContent;

const staticContent = {
  source: "migrated-wordpress",
  path: "/about/example",
  title: "Migrated Static Page",
  description: "A readable migrated static page.",
  section: "About",
  blocks: [
    {
      type: "heading",
      content: "Static Heading",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>Static page copy with <a href="/education">education</a>.</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;

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
    expect(container.querySelector(".tw-max-w-5xl")).not.toBeInTheDocument();
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
    expect(screen.getByText(/Trusted/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "a link" })).toHaveAttribute(
      "href",
      "/about"
    );

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveTextContent(
      "Sorry, your browser does not support embedded videos."
    );
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders migrated static WordPress pages without article metadata chrome", () => {
    const { container } = render(
      <MigratedWordPressStaticPage content={staticContent} />
    );

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-content-source",
      "migrated-wordpress"
    );
    expect(container.querySelector(".tw-max-w-5xl")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Migrated Static Page" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("A readable migrated static page.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Static Heading" })
    ).toBeInTheDocument();
    expect(screen.queryByText("By")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "education" })).toHaveAttribute(
      "href",
      "/education"
    );
  });

  it("only accepts compile-time literals as trusted HTML", () => {
    const runtimeHtml: string = "<p>pretend this came from a CMS</p>";
    // @ts-expect-error runtime-typed strings must not reach the HTML sink
    migratedWordPressTrustedHtml(runtimeHtml);

    expect(migratedWordPressTrustedHtml("<p>in-repo literal</p>")).toBe(
      "<p>in-repo literal</p>"
    );
  });
});
