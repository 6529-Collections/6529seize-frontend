import { render, screen, waitFor } from "@testing-library/react";
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

// Simulates a failed chunk download for the on-demand native layout.
jest.mock("@/components/layout/MobileLayout", () => {
  throw new Error("Loading chunk failed");
});

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

it("shows the page instead of the startup placeholder when the native layout cannot load", async () => {
  (useDeviceInfo as jest.Mock).mockReturnValue({
    isApp: true,
    hasTouchScreen: true,
    isMobileDevice: true,
    isAppleMobile: false,
  });
  (useIsMobileScreen as jest.Mock).mockReturnValue(true);
  const consoleError = jest.spyOn(console, "error").mockImplementation();
  try {
    const { container } = render(
      <LayoutWrapper>
        <main>Page content</main>
      </LayoutWrapper>
    );
    expect(
      container.querySelector('[data-native-startup="pending"]')
    ).not.toBeNull();

    await waitFor(() =>
      expect(
        container.querySelector('[data-native-startup="ready"]')
      ).not.toBeNull()
    );
    expect(screen.getByTestId("web-layout")).toContainElement(
      screen.getByRole("main")
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load the native layout",
      expect.any(Error)
    );
  } finally {
    consoleError.mockRestore();
  }
});
