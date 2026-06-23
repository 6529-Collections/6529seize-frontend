import { render, screen } from "@testing-library/react";
import BrainRightSidebarSettings from "@/components/brain/right-sidebar/BrainRightSidebarSettings";

const captured: string[] = [];

jest.mock("@/components/waves/groups/WaveSettingsSections", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(`settings:${props.wave.id}`);
    return <div data-testid="wave-settings" />;
  },
}));

describe("BrainRightSidebarSettings", () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it("renders the settings sections", () => {
    render(<BrainRightSidebarSettings wave={{ id: "wave-1" } as any} />);

    expect(screen.getByTestId("wave-settings")).toBeInTheDocument();
    expect(captured).toEqual(["settings:wave-1"]);
  });
});
