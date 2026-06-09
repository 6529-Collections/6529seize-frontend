import { render, screen } from "@testing-library/react";
import BrainRightSidebarContent from "@/components/brain/right-sidebar/BrainRightSidebarContent";

const captured: string[] = [];

jest.mock("@/components/waves/specs/WaveSpecs", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(`specs:${props.wave.id}`);
    return <div data-testid="wave-specs" />;
  },
}));

describe("BrainRightSidebarContent", () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it("renders the about section only", () => {
    render(<BrainRightSidebarContent wave={{ id: "wave-1" } as any} />);

    expect(screen.getByTestId("wave-specs")).toBeInTheDocument();
    expect(captured).toEqual(["specs:wave-1"]);
  });
});
