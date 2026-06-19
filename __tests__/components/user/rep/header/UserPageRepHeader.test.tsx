import { render, screen } from "@testing-library/react";
import UserPageRepHeader from "@/components/user/rep/header/UserPageRepHeader";

const mockProfile = {
  handle: "testuser",
  display: "Test User",
  query: "testuser",
} as any;

const defaultProps = {
  categories: [],
  profile: mockProfile,
  repDirection: "received" as const,
  onOpenOverviewContributors: jest.fn(),
  onOpenCategoryContributors: jest.fn(),
  onOpenGlobalCategory: jest.fn(),
  onRepDirectionChange: jest.fn(),
  loading: false,
  visibleCount: 5,
  onShowMore: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

describe("UserPageRepHeader", () => {
  it("shows rep totals when provided", () => {
    const overview = {
      total_rep: 1500,
      contributor_count: 25,
      authenticated_user_contribution: null,
      contributors: { data: [], page: 1, next: false },
    } as any;
    render(<UserPageRepHeader {...defaultProps} overview={overview} />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("renders without overview", () => {
    const { container } = render(
      <UserPageRepHeader {...defaultProps} overview={null} />
    );
    expect(container).toHaveTextContent("Rep");
  });
});
