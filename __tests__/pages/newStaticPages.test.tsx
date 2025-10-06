import About100M from "@/app/about/100m-project/page";
import FromFibonacciToFidenza from "@/app/blog/from-fibonacci-to-fidenza/page";
import EmailProtection from "@/app/cdn-cgi/l/email-protection/page";
import EmailSignatures from "@/app/email-signatures/page";
import ConstructionToken from "@/app/museum/6529-fund-szn1/construction-token/page";
import ImageWithArrow from "@/app/museum/6529-fund-szn1/image-with-arrow/page";
import MuseumFund from "@/app/museum/6529-fund-szn1/page";
import { render, screen } from "@testing-library/react";

// Mock next/dynamic for any dynamic imports
jest.mock("next/dynamic", () => () => {
  const MockDynamicComponent = () => <div data-testid="dynamic-component" />;
  MockDynamicComponent.displayName = "MockDynamicComponent";
  return MockDynamicComponent;
});

// Mock any external dependencies that might be imported
jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn(() => ({})),
}));

describe("Static Pages Rendering", () => {
  it("should render 100M Project page with correct content and metadata", () => {
    render(<About100M />);

    // Test for page title in document structure
    expect(document.title).toContain("100M PROJECT");
    expect(document.title).toContain("6529.io");

    // Test for key heading content using more semantic queries
    const headings = screen.getAllByText(/100M PROJECT/i);
    expect(headings.length).toBeGreaterThan(0);

    // Test for canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toHaveAttribute("href", "/about/100m-project/");
  });

  it("should render Fibonacci to Fidenza blog page with correct content", () => {
    render(<FromFibonacciToFidenza />);

    expect(document.title).toContain("FROM FIBONACCI TO FIDENZA");
    expect(document.title).toContain("6529.io");

    const headings = screen.getAllByText(/FROM FIBONACCI TO FIDENZA/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should render email protection page with correct content", () => {
    render(<EmailProtection />);

    // Be flexible with title - Cloudflare page might have different title format
    expect(document.title).toContain("Email Protection");

    const content = screen.getAllByText(/Email Protection/i);
    expect(content.length).toBeGreaterThan(0);
  });

  it("should render email signatures page with correct content", () => {
    render(<EmailSignatures />);

    expect(document.title).toContain("EMAIL SIGNATURES");
    expect(document.title).toContain("6529.io");

    const headings = screen.getAllByText(/EMAIL SIGNATURES/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should render museum fund szn1 page with correct content", () => {
    render(<MuseumFund />);

    expect(document.title).toContain("6529 FUND SZN1");
    expect(document.title).toContain("6529.io");

    const headings = screen.getAllByText(/6529 FUND SZN1/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should render construction token page with correct content", () => {
    render(<ConstructionToken />);

    expect(document.title).toContain("CONSTRUCTION TOKEN");
    expect(document.title).toContain("6529.io");

    const headings = screen.getAllByText(/CONSTRUCTION TOKEN/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should render image with arrow page with correct content", () => {
    render(<ImageWithArrow />);

    // Be flexible with title - it might have additional prefixes like artist name
    expect(document.title).toContain("IMAGE WITH ARROW");
    expect(document.title).toContain("6529.io");

    const headings = screen.getAllByText(/IMAGE WITH ARROW/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  describe("Page Structure and Metadata", () => {
    it("should set proper meta tags for SEO", () => {
      render(<About100M />);

      // Check for canonical link
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      expect(canonicalLink).toBeInTheDocument();
      expect(canonicalLink?.getAttribute("href")).toBe("/about/100m-project/");

      // Check for robots meta tag
      const robotsMeta = document.querySelector('meta[name="robots"]');
      expect(robotsMeta).toBeInTheDocument();
    });

    it("should have proper Open Graph tags", () => {
      render(<EmailSignatures />);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle).toBeInTheDocument();
      expect(ogTitle?.getAttribute("content")).toContain("EMAIL SIGNATURES");

      const ogType = document.querySelector('meta[property="og:type"]');
      expect(ogType).toBeInTheDocument();
      expect(ogType?.getAttribute("content")).toBe("article");

      const ogSiteName = document.querySelector(
        'meta[property="og:site_name"]'
      );
      expect(ogSiteName).toBeInTheDocument();
      expect(ogSiteName?.getAttribute("content")).toBe("6529.io");
    });

    it("should have proper Twitter Card tags", () => {
      render(<MuseumFund />);

      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      expect(twitterCard).toBeInTheDocument();
      expect(twitterCard?.getAttribute("content")).toBe("summary_large_image");
    });
  });

  describe("Error Resistance and Stability", () => {
    it("should render all page components without throwing errors", () => {
      // Test that each page component can render without throwing
      const pages = [
        About100M,
        FromFibonacciToFidenza,
        EmailProtection,
        EmailSignatures,
        MuseumFund,
        ConstructionToken,
        ImageWithArrow,
      ];

      pages.forEach((PageComponent) => {
        expect(() => {
          render(<PageComponent />);
        }).not.toThrow();
      });
    });

    it("should handle multiple renders without side effects", () => {
      // Test that components can be rendered multiple times safely
      const renderPage = () => render(<About100M />);

      expect(renderPage).not.toThrow();
      expect(renderPage).not.toThrow();
      expect(renderPage).not.toThrow();
    });

    it("should maintain consistent document structure across renders", () => {
      const { rerender } = render(<EmailSignatures />);

      const initialTitle = document.title;
      const initialCanonical = document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href");

      rerender(<EmailSignatures />);

      expect(document.title).toBe(initialTitle);
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute("href")
      ).toBe(initialCanonical);
    });
  });
});
