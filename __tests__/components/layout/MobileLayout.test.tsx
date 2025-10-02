import { render, screen } from "@testing-library/react";

const useDeviceInfo = jest.fn();
const useIsMobileScreen = jest.fn();

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: useDeviceInfo,
}));

jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: useIsMobileScreen,
}));
jest.mock("@/components/layout/AppLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));
jest.mock("@/components/layout/SmallScreenLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="small-layout">{children}</div>
  ),
}));

const MobileLayout = require("@/components/layout/MobileLayout").default;

describe("MobileLayout", () => {
  it("renders AppLayout when running in app", () => {
    useDeviceInfo.mockReturnValue({ isApp: true });
    useIsMobileScreen.mockReturnValue(false);
    render(<MobileLayout>child</MobileLayout>);
    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders SmallScreenLayout on small screens", () => {
    useDeviceInfo.mockReturnValue({ isApp: false });
    useIsMobileScreen.mockReturnValue(true);
    render(<MobileLayout>child</MobileLayout>);
    expect(screen.getByTestId("small-layout")).toBeInTheDocument();
  });

  it("renders children directly otherwise", () => {
    useDeviceInfo.mockReturnValue({ isApp: false });
    useIsMobileScreen.mockReturnValue(false);
    render(<MobileLayout>child</MobileLayout>);
    expect(screen.queryByTestId("app-layout")).not.toBeInTheDocument();
    expect(screen.queryByTestId("small-layout")).not.toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
