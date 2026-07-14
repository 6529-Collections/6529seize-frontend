import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrainMobileAbout from "@/components/brain/mobile/BrainMobileAbout";
import { useQuery } from "@tanstack/react-query";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import {
  Mode,
  SidebarTab,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";

jest.mock("@/components/brain/right-sidebar/WaveContent", () => ({
  __esModule: true,
  WaveContent: (props: any) => (
    <div
      data-testid="wave-content"
      data-mode={props.mode}
      data-show-tabs={props.showTabs}
    >
      <button
        data-testid="toggle-followers"
        onClick={() =>
          props.setMode(
            props.mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS
          )
        }
      >
        toggle followers
      </button>
    </div>
  ),
}));

jest.mock("@tanstack/react-query");
jest.mock("@/components/brain/my-stream/layout/LayoutContext");

const mockUseQuery = useQuery as jest.Mock;
const mockUseLayout = useLayout as jest.Mock;

const wave = { id: "1" } as any;
const setActiveTab = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLayout.mockReturnValue({ mobileAboutViewStyle: {} });
});

test("renders the shared right-panel content without a nested tab row", () => {
  mockUseQuery.mockReturnValue({ data: wave });
  const { container } = render(
    <BrainMobileAbout
      activeWaveId="1"
      activeTab={SidebarTab.ABOUT}
      setActiveTab={setActiveTab}
    />
  );
  expect(screen.getByTestId("wave-content")).toBeInTheDocument();
  expect(screen.getByTestId("wave-content")).toHaveAttribute(
    "data-show-tabs",
    "false"
  );
  expect(container.firstElementChild).toHaveClass("tw-bg-iron-950");
});

test("toggles to followers view and back", async () => {
  mockUseQuery.mockReturnValue({ data: wave });
  const user = userEvent.setup();
  render(
    <BrainMobileAbout
      activeWaveId="1"
      activeTab={SidebarTab.ABOUT}
      setActiveTab={setActiveTab}
    />
  );
  const content = screen.getByTestId("wave-content");
  await user.click(screen.getByTestId("toggle-followers"));
  expect(content).toHaveAttribute("data-mode", Mode.FOLLOWERS);
  await user.click(screen.getByTestId("toggle-followers"));
  expect(content).toHaveAttribute("data-mode", Mode.CONTENT);
});

test("renders nothing when no wave data", () => {
  mockUseQuery.mockReturnValue({ data: undefined });
  const { container } = render(
    <BrainMobileAbout
      activeWaveId="1"
      activeTab={SidebarTab.ABOUT}
      setActiveTab={setActiveTab}
    />
  );
  expect(container.firstChild?.childNodes.length).toBe(0);
});
