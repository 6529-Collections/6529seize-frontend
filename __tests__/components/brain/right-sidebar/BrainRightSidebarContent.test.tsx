import { render, screen } from "@testing-library/react";
import BrainRightSidebarContent from "@/components/brain/right-sidebar/BrainRightSidebarContent";

const captured: string[] = [];

jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarBoostedDrops",
  () => ({
    __esModule: true,
    WaveLeaderboardRightSidebarBoostedDrops: (props: any) => {
      captured.push(`boosted:${props.wave.id}`);
      return <div data-testid="boosted-drops" />;
    },
  })
);

jest.mock("@/components/waves/specs/WaveSpecs", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(`specs:${props.wave.id}`);
    return <div data-testid="wave-specs" />;
  },
}));

jest.mock("@/components/waves/specs/WaveIdentitySubmissionSpecs", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(`identity:${props.wave.id}`);
    return <div data-testid="identity-submission-specs" />;
  },
}));

jest.mock("@/components/waves/groups/WaveGroups", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(`groups:${props.wave.id}`);
    return <div data-testid="wave-groups" />;
  },
}));

describe("BrainRightSidebarContent", () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it("renders sidebar sections in the expected order", () => {
    render(<BrainRightSidebarContent wave={{ id: "wave-1" } as any} />);

    expect(screen.getByTestId("boosted-drops")).toBeInTheDocument();
    expect(screen.getByTestId("wave-specs")).toBeInTheDocument();
    expect(screen.getByTestId("identity-submission-specs")).toBeInTheDocument();
    expect(screen.getByTestId("wave-groups")).toBeInTheDocument();
    expect(captured).toEqual([
      "boosted:wave-1",
      "specs:wave-1",
      "identity:wave-1",
      "groups:wave-1",
    ]);
  });
});
