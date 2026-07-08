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

const museumDirectoryContent = {
  source: "migrated-wordpress",
  path: "/museum",
  title: "6529 MUSEUM OF ART",
  description: "Museum generated excerpt should stay out of the page body.",
  section: "Museum",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Museum intro copy.</p>"),
    },
    {
      type: "heading",
      content: "6529 MUSEUM OF ART GALLERIES",
    },
    {
      type: "image",
      media: {
        src: "https://example.com/one-of-one.png",
        alt: "1 of 1 gallery icon",
        width: 165,
        height: 166,
      },
    },
    {
      type: "heading",
      content: "1 OF 1 ART",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<ul><li><a href="/museum/yongoh-kim">Y<u>ONGOH KIM</u></a></li><li><a href="/museum/sozet-lounge">SOZET LOUNGE</a></li></ul>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;

const museumCollectionIndexContent = {
  source: "migrated-wordpress",
  path: "/museum/genesis",
  title: "GENESIS",
  description: "Genesis generated excerpt should stay out of the page body.",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Visit the gallery.</p>"),
    },
    {
      type: "image",
      media: {
        src: "https://example.com/genesis.jpg",
        alt: "Genesis gallery",
        width: 1300,
        height: 644,
      },
    },
    {
      type: "heading",
      content: "EARLY ON-CHAIN GENERATIVE ART",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="/museum/genesis/autoglyphs"><strong>Autoglyphs</strong></a><br>Larva Labs</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="/museum/genesis/squiggly-wtf"><strong>Squiggly.wtf</strong></a><br>natealex</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="/museum/genesis/labios"><strong>Labios</strong></a><br>Manoloide</p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="/museum/genesis/cryptocube"><strong>Cryptocube</strong></a><br>Han</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;

const museumDetailContent = {
  source: "migrated-wordpress",
  path: "/museum/genesis/fidenza",
  title: "FIDENZA",
  description:
    "Fidenza Tyler Hobbs Mint Date: 06/11/2021 Artist Narrative duplicated excerpt.",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Fidenza</strong><br>Tyler Hobbs<br>Mint Date: 06/11/2021</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Artist Narrative</strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Fidenza is by far my most versatile algorithm to date.</p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://example.com/fidenza-119.png",
        alt: "Fidenza 119",
        width: 250,
        height: 300,
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 119</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits:</strong><br>Collision Check: Relaxed</p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://example.com/fidenza-313.png",
        alt: "Fidenza 313",
        width: 250,
        height: 300,
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 313</p>"),
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
    expect(container.querySelector(".tw-max-w-6xl")).not.toBeInTheDocument();
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

  it("renders the museum directory as visible gallery cards", () => {
    const { container } = render(
      <MigratedWordPressStaticPage content={museumDirectoryContent} />
    );

    expect(
      screen.queryByText(museumDirectoryContent.description)
    ).not.toBeInTheDocument();
    expect(container.querySelector("[data-museum-directory-grid]")).toBeInTheDocument();
    expect(screen.getByAltText("1 of 1 gallery icon")).toHaveClass(
      "tw-object-contain"
    );
    expect(screen.getByRole("link", { name: "YONGOH KIM" })).toHaveAttribute(
      "href",
      "/museum/yongoh-kim"
    );
  });

  it("renders museum collection indexes as responsive item grids", () => {
    const { container } = render(
      <MigratedWordPressStaticPage content={museumCollectionIndexContent} />
    );

    expect(
      screen.queryByText(museumCollectionIndexContent.description)
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-museum-collection-index]")
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(
        "[data-museum-collection-index] a[href^='/museum/genesis/']"
      )
    ).toHaveLength(4);
  });

  it("renders museum detail media beside item text without the generated excerpt", () => {
    const { container } = render(
      <MigratedWordPressStaticPage content={museumDetailContent} />
    );

    expect(
      screen.queryByText(museumDetailContent.description)
    ).not.toBeInTheDocument();
    expect(container.querySelector("[data-museum-detail-grid]")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-museum-detail-card]")).toHaveLength(
      2
    );
    expect(screen.getByAltText("Fidenza 119")).toHaveClass("tw-mx-auto");
    expect(screen.getByText("Token: 119")).toBeInTheDocument();
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
