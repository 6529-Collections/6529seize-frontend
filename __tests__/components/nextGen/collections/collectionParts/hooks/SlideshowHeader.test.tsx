import React from "react";
import { render, screen } from "@testing-library/react";
import SlideshowHeader from "@/components/nextGen/collections/collectionParts/hooks/SlideshowHeader";

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockedLink = ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
  MockedLink.displayName = "Link";
  return MockedLink;
});

// Mock FontAwesome icons
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon, className }: any) => (
    <span data-testid="font-awesome-icon" data-icon={icon.iconName} className={className} />
  ),
}));

// Mock the formatNameForUrl helper
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: jest.fn((name: string) => name.replace(/ /g, "-").toLowerCase()),
}));

import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";

describe("SlideshowHeader", () => {
  const mockFormatNameForUrl = formatNameForUrl as jest.MockedFunction<typeof formatNameForUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatNameForUrl.mockImplementation((name: string) => name.replace(/ /g, "-").toLowerCase());
  });

  it("renders the component with correct structure", () => {
    render(<SlideshowHeader collectionName="Test Collection" />);
    
    // Should render the migrated Tailwind row structure
    const row = screen.getByRole("link").closest(".tw-flex-wrap");
    expect(row).toBeInTheDocument();
    
    // Should render the link with correct text
    expect(screen.getByText("View All")).toBeInTheDocument();
    
    // Should render the FontAwesome icon
    const icon = screen.getByTestId("font-awesome-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("data-icon", "circle-arrow-right");
  });

  it("generates correct href using formatNameForUrl", () => {
    const collectionName = "My Test Collection";
    render(<SlideshowHeader collectionName={collectionName} />);
    
    // Should call formatNameForUrl with the collection name
    expect(mockFormatNameForUrl).toHaveBeenCalledWith(collectionName);
    
    // Should generate correct href
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nextgen/collection/my-test-collection/art");
  });

  it("handles collection names with special characters", () => {
    const collectionName = "Collection With Spaces & Symbols!";
    render(<SlideshowHeader collectionName={collectionName} />);
    
    expect(mockFormatNameForUrl).toHaveBeenCalledWith(collectionName);
    
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nextgen/collection/collection-with-spaces-&-symbols!/art");
  });

  it("applies correct CSS classes", () => {
    render(<SlideshowHeader collectionName="Test" />);
    
    const link = screen.getByRole("link");
    expect(link).toHaveClass("tw-flex", "tw-items-center", "tw-gap-2", "tw-no-underline");
    
    const heading = screen.getByRole("heading", { level: 5 });
    expect(heading).toHaveClass("tw-mb-0", "tw-text-white", "tw-flex", "tw-items-center", "tw-gap-2");
  });

  it("maintains semantic HTML structure", () => {
    render(<SlideshowHeader collectionName="Test" />);
    
    // Should have proper heading hierarchy
    const heading = screen.getByRole("heading", { level: 5 });
    expect(heading).toBeInTheDocument();
    
    // Link should be accessible
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAccessibleName();
  });

  it("handles empty collection name gracefully", () => {
    render(<SlideshowHeader collectionName="" />);
    
    expect(mockFormatNameForUrl).toHaveBeenCalledWith("");
    
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nextgen/collection//art");
    expect(screen.getByText("View All")).toBeInTheDocument();
  });

  it("renders consistent UI elements", () => {
    render(<SlideshowHeader collectionName="Test Collection" />);
    
    // Should always show "View All" text
    expect(screen.getByText("View All")).toBeInTheDocument();
    
    // Should always show the arrow icon
    const icon = screen.getByTestId("font-awesome-icon");
    expect(icon).toBeInTheDocument();
    
    // Link should be properly nested within the Tailwind grid wrapper
    const link = screen.getByRole("link");
    const col = link.closest(".tw-relative");
    expect(col).toHaveClass("tw-flex", "tw-items-center", "tw-justify-end");
  });

  it("uses correct FontAwesome icon", () => {
    render(<SlideshowHeader collectionName="Test" />);
    
    const icon = screen.getByTestId("font-awesome-icon");
    expect(icon).toHaveAttribute("data-icon", "circle-arrow-right");
  });
});
