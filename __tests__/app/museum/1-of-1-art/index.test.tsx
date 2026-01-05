import Museum1of1ArtPage from "@/app/museum/1-of-1-art/page";
import { render, screen } from "@testing-library/react";

// Mock the Header component since it's dynamically imported

// Mock HeaderPlaceholder
jest.mock("@/components/header/HeaderPlaceholder", () => {
  return function MockHeaderPlaceholder() {
    return <div data-testid="header-placeholder">Header Placeholder</div>;
  };
});

describe("Museum1of1ArtPage", () => {
  const renderComponent = () => {
    return render(<Museum1of1ArtPage />);
  };

  it("renders the page title", () => {
    renderComponent();

    const titleElement = document.querySelector("title");
    expect(titleElement?.textContent).toBe("1 OF 1 ART - 6529.io");
  });

  it("includes correct meta tags for SEO", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    // Check for robots meta tag
    const robotsMeta = Array.from(metaTags).find(
      (meta) => meta.getAttribute("name") === "robots"
    );
    expect(robotsMeta?.getAttribute("content")).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
  });

  it("includes canonical link", () => {
    renderComponent();

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeInTheDocument();
    expect(canonicalLink?.getAttribute("href")).toBe("/museum/1-of-1-art/");
  });

  it("includes Open Graph meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const ogTitle = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:title"
    );
    expect(ogTitle?.getAttribute("content")).toBe("1 OF 1 ART - 6529.io");

    const ogType = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:type"
    );
    expect(ogType?.getAttribute("content")).toBe("article");

    const ogUrl = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:url"
    );
    expect(ogUrl?.getAttribute("content")).toBe("/museum/1-of-1-art/");
  });

  it("includes Twitter meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const twitterCard = Array.from(metaTags).find(
      (meta) => meta.getAttribute("name") === "twitter:card"
    );
    expect(twitterCard?.getAttribute("content")).toBe("summary_large_image");

    const twitterSite = Array.from(metaTags).find(
      (meta) => meta.getAttribute("name") === "twitter:site"
    );
    expect(twitterSite?.getAttribute("content")).toBe("@om100m");
  });

  it("renders the main page structure", () => {
    renderComponent();

    expect(document.querySelector("#boxed-wrapper")).toBeInTheDocument();
    expect(document.querySelector("#wrapper")).toBeInTheDocument();
    expect(document.querySelector("#main")).toBeInTheDocument();
    expect(document.querySelector("#content")).toBeInTheDocument();
  });

  it("includes page title bar section", () => {
    renderComponent();

    const titleBarSection = document.querySelector(
      ".avada-page-titlebar-wrapper"
    );
    expect(titleBarSection).toBeInTheDocument();
    expect(titleBarSection).toHaveAttribute("aria-label", "Page Title Bar");
  });

  it("displays the page heading", () => {
    renderComponent();

    const pageHeadings = screen.getAllByText("1 OF 1 ART");
    expect(pageHeadings.length).toBeGreaterThan(0);
    expect(pageHeadings[0]).toBeInTheDocument();
    expect(pageHeadings[0]?.tagName).toBe("H1");
  });

  it("includes skip to content link for accessibility", () => {
    renderComponent();

    const skipLink = screen.getByText("Skip to content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass("skip-link", "screen-reader-text");
    expect(skipLink).toHaveAttribute("href", "#content");
  });

  it("includes go to top functionality", () => {
    renderComponent();

    const goToTopSection = document.querySelector(".to-top-container");
    expect(goToTopSection).toBeInTheDocument();
    expect(goToTopSection).toHaveAttribute(
      "aria-labelledby",
      "awb-to-top-label"
    );

    const goToTopLink = document.querySelector("#toTop");
    expect(goToTopLink).toBeInTheDocument();
    expect(goToTopLink).toHaveClass("fusion-top-top-link");
  });

  it("includes RSS feed links", () => {
    renderComponent();

    const feedLinks = document.querySelectorAll(
      'link[type="application/rss+xml"]'
    );
    expect(feedLinks.length).toBeGreaterThan(0);

    const mainFeed = Array.from(feedLinks).find(
      (link) => link.getAttribute("href") === "/feed/"
    );
    expect(mainFeed).toBeInTheDocument();
    expect(mainFeed?.getAttribute("title")).toBe("6529.io » Feed");
  });

  it("includes site name in meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const ogSiteName = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:site_name"
    );
    expect(ogSiteName?.getAttribute("content")).toBe("6529.io");
  });
});
