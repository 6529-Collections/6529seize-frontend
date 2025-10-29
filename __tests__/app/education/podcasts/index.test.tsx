import PodcastsPage from "@/app/education/podcasts/page";
import { render } from "@testing-library/react";

// Mock the Header component since it's dynamically imported

// Mock HeaderPlaceholder
jest.mock("@/components/header/HeaderPlaceholder", () => {
  return function MockHeaderPlaceholder() {
    return <div data-testid="header-placeholder">Header Placeholder</div>;
  };
});

describe("PodcastsPage", () => {
  const renderComponent = () => {
    return render(<PodcastsPage />);
  };

  it("renders the page title", () => {
    renderComponent();

    const titleElement = document.querySelector("title");
    expect(titleElement?.textContent).toBe("PODCASTS");
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

    // Check for description meta tag
    const descriptionMeta = Array.from(metaTags).find(
      (meta) => meta.getAttribute("name") === "description"
    );
    expect(descriptionMeta?.getAttribute("content")).toContain(
      "THE PSEUDONYMOUS PHILOSOPHER: PUNK 6529'S VISION FOR OUR DECENTRALIZED FUTURE"
    );
  });

  it("includes Open Graph meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const ogTitle = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:title"
    );
    expect(ogTitle?.getAttribute("content")).toBe("PODCASTS");

    const ogType = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:type"
    );
    expect(ogType?.getAttribute("content")).toBe("article");

    const ogUrl = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:url"
    );
    expect(ogUrl?.getAttribute("content")).toBe("/education/podcasts/");
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

    const twitterData = Array.from(metaTags).find(
      (meta) => meta.getAttribute("name") === "twitter:data1"
    );
    expect(twitterData?.getAttribute("content")).toBe("24 minutes");
  });

  it("includes canonical link", () => {
    renderComponent();

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeInTheDocument();
    expect(canonicalLink?.getAttribute("href")).toBe("/education/podcasts/");
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

  it("includes correct og:image meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const ogImage = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:image"
    );
    expect(ogImage?.getAttribute("content")).toBe(
      "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/09/6529-header-logo.png"
    );

    const ogImageWidth = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:image:width"
    );
    expect(ogImageWidth?.getAttribute("content")).toBe("100");

    const ogImageHeight = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:image:height"
    );
    expect(ogImageHeight?.getAttribute("content")).toBe("100");
  });

  it("includes site name in og meta tags", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const ogSiteName = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "og:site_name"
    );
    expect(ogSiteName?.getAttribute("content")).toBe("6529.io");
  });

  it("includes article modified time", () => {
    renderComponent();

    const metaTags = document.querySelectorAll("meta");

    const modifiedTime = Array.from(metaTags).find(
      (meta) => meta.getAttribute("property") === "article:modified_time"
    );
    expect(modifiedTime).toBeInTheDocument();
    expect(modifiedTime?.getAttribute("content")).toMatch(/2022-06-15/);
  });
});
