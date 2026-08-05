import { render } from "@testing-library/react";
import UserPageDrops from "@/components/user/brain/UserPageDrops";

jest.mock("@/components/drops/view/Drops", () => ({
  __esModule: true,
  default: () => <div data-testid="drops" />,
}));
jest.mock("@/components/user/brain/UserPageBrainActivity", () => ({
  __esModule: true,
  default: () => <div data-testid="brain-activity-card" />,
}));
jest.mock("@/components/user/brain/UserPageBrainSidebar", () => ({
  __esModule: true,
  default: () => <div data-testid="brain-sidebar" />,
}));
jest.mock(
  "@/components/user/mention-shortcuts/UserPageMentionShortcuts",
  () => ({
    __esModule: true,
    default: () => <div data-testid="quick-tags-section" />,
  })
);

describe("UserPageDrops", () => {
  it("renders Drops when profile has handle", () => {
    const { getByTestId } = render(
      <UserPageDrops profile={{ handle: "test" } as any} />
    );
    const activity = getByTestId("brain-activity-card");
    const quickTags = getByTestId("quick-tags-section");
    const drops = getByTestId("drops");
    expect(activity).toBeInTheDocument();
    expect(quickTags).toBeInTheDocument();
    expect(drops).toBeInTheDocument();
    expect(getByTestId("brain-sidebar")).toBeInTheDocument();
    expect(activity.nextElementSibling).toBe(quickTags);
    expect(quickTags.nextElementSibling).toBe(drops);
  });

  it("hides Drops when no profile handle", () => {
    const { queryByTestId } = render(<UserPageDrops profile={null} />);
    expect(queryByTestId("brain-activity-card")).toBeNull();
    expect(queryByTestId("quick-tags-section")).toBeNull();
    expect(queryByTestId("drops")).toBeNull();
    expect(queryByTestId("brain-sidebar")).toBeNull();
  });
});
