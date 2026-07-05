import { render, screen } from "@testing-library/react";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileScreen from "@/hooks/isMobileScreen";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@/components/layout/WebLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="web-layout">{children}</div>
  ),
}));

jest.mock("@/components/layout/SmallScreenLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="small-screen-layout">{children}</div>
  ),
}));

jest.mock("@/components/layout/MobileLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-layout">{children}</div>
  ),
}));

jest.mock("@/components/footer/FooterWrapper", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/contexts/RefreshContext", () => ({
  useGlobalRefresh: () => ({ refreshKey: 0 }),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
  scheduleMobileLaunchFlush: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo");
jest.mock("@/hooks/isMobileScreen");

const useDeviceInfoMock = useDeviceInfo as jest.Mock;
const useIsMobileScreenMock = useIsMobileScreen as jest.Mock;

function setDeviceInfo({
  isApp = false,
  hasTouchScreen = false,
  isMobileDevice = false,
} = {}) {
  useDeviceInfoMock.mockReturnValue({
    isApp,
    hasTouchScreen,
    isMobileDevice,
    isAppleMobile: false,
  });
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  useIsMobileScreenMock.mockReturnValue(width <= 750);
}

function renderLayout() {
  return render(
    <LayoutWrapper>
      <div data-testid="content" />
    </LayoutWrapper>
  );
}

describe("LayoutWrapper layout selection", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("uses WebLayout on a wide desktop without touch", () => {
    setDeviceInfo();
    setViewportWidth(1440);
    renderLayout();
    expect(screen.getByTestId("web-layout")).toBeInTheDocument();
  });

  it("keeps WebLayout on hybrid touch laptops in narrow windows (Surface regression)", () => {
    // Touch-first detection reports false for hybrids and the UA is not
    // mobile, so even a snapped/narrow window must stay on the web layout.
    setDeviceInfo({ hasTouchScreen: false, isMobileDevice: false });
    setViewportWidth(950);
    renderLayout();
    expect(screen.getByTestId("web-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("small-screen-layout")).not.toBeInTheDocument();
  });

  it("uses SmallScreenLayout for touch-first devices at narrow widths", () => {
    setDeviceInfo({ hasTouchScreen: true });
    setViewportWidth(390);
    renderLayout();
    expect(screen.getByTestId("small-screen-layout")).toBeInTheDocument();
  });

  it("keeps SmallScreenLayout for phone user agents even with a mouse attached", () => {
    // A mouse gives the phone a fine pointer, so touch-first detection turns
    // false — the mobile UA must still pin the phone to the small layout.
    setDeviceInfo({ hasTouchScreen: false, isMobileDevice: true });
    setViewportWidth(390);
    renderLayout();
    expect(screen.getByTestId("small-screen-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("web-layout")).not.toBeInTheDocument();
  });

  it("uses WebLayout for mobile user agents on wide viewports", () => {
    setDeviceInfo({ isMobileDevice: true });
    setViewportWidth(1440);
    renderLayout();
    expect(screen.getByTestId("web-layout")).toBeInTheDocument();
  });

  it("always uses MobileLayout inside the native app", () => {
    setDeviceInfo({ isApp: true, hasTouchScreen: true, isMobileDevice: true });
    setViewportWidth(390);
    renderLayout();
    expect(screen.getByTestId("mobile-layout")).toBeInTheDocument();
  });
});
