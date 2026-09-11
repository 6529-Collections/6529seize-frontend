import SlideshowHeader from "@/components/nextGen/collections/collectionParts/hooks/SlideshowHeader";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  const MockedLink = ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
  MockedLink.displayName = "Link";
  return MockedLink;
});

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon, className }: any) => (
    <span
      data-testid="font-awesome-icon"
      data-icon={icon.iconName}
      className={className}
    />
  ),
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: jest.fn((name: string) =>
    name.replace(/ /g, "-").toLowerCase()
  ),
}));

const mockFormatNameForUrl = formatNameForUrl as jest.MockedFunction<
  typeof formatNameForUrl
>;

describe("SlideshowHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an accessible view-all link with modern control styling", () => {
    render(<SlideshowHeader collectionName="Test Collection" />);

    const link = screen.getByRole("link", {
      name: "View all Test Collection artwork",
    });
    expect(link).toHaveAttribute(
      "href",
      "/nextgen/collection/test-collection/art"
    );
    expect(link).toHaveClass(
      "tw-inline-flex",
      "tw-min-h-10",
      "tw-rounded-md",
      "focus-visible:tw-ring-primary-400"
    );
    expect(mockFormatNameForUrl).toHaveBeenCalledWith("Test Collection");
  });

  it("renders the arrow icon as decorative", () => {
    render(<SlideshowHeader collectionName="Test" />);

    const icon = screen.getByTestId("font-awesome-icon");
    expect(icon).toHaveAttribute("data-icon", "circle-arrow-right");
    expect(icon).toHaveClass("tw-h-5", "tw-w-5");
  });
});
