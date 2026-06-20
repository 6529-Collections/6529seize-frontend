import { fireEvent, render, screen } from "@testing-library/react";
import NativeRouteOverlay from "@/components/native-navigation/NativeRouteOverlay";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const back = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/alice",
  useRouter: () => ({
    back,
    replace,
  }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseDeviceInfo = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const renderAppOverlay = () => {
  mockedUseDeviceInfo.mockReturnValue({
    hasTouchScreen: true,
    isApp: true,
    isAppleMobile: true,
    isMobileDevice: true,
  });

  return render(
    <NativeRouteOverlay>
      <a href="/bob/collected?address=0x1#items">Bob</a>
      <a href="https://example.com">External</a>
    </NativeRouteOverlay>
  );
};

describe("NativeRouteOverlay", () => {
  beforeEach(() => {
    back.mockClear();
    replace.mockClear();
    mockedUseDeviceInfo.mockReset();
  });

  it("renders app overlay content after mount", async () => {
    renderAppOverlay();

    expect(
      await screen.findByTestId("native-route-overlay")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bob" })).toBeInTheDocument();
  });

  it("closes on an inward left-edge swipe", async () => {
    renderAppOverlay();

    const overlay = await screen.findByTestId("native-route-overlay");
    fireEvent.touchStart(overlay, {
      touches: [{ clientX: 4, clientY: 20 }],
    });
    fireEvent.touchMove(overlay, {
      touches: [{ clientX: 96, clientY: 28 }],
    });
    fireEvent.touchEnd(overlay, {
      changedTouches: [{ clientX: 96, clientY: 28 }],
    });

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("closes on an inward right-edge swipe", async () => {
    renderAppOverlay();

    const overlay = await screen.findByTestId("native-route-overlay");
    fireEvent.touchStart(overlay, {
      touches: [{ clientX: window.innerWidth - 4, clientY: 20 }],
    });
    fireEvent.touchMove(overlay, {
      touches: [{ clientX: window.innerWidth - 96, clientY: 28 }],
    });
    fireEvent.touchEnd(overlay, {
      changedTouches: [{ clientX: window.innerWidth - 96, clientY: 28 }],
    });

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("replaces same-origin overlay links to keep the overlay stack shallow", async () => {
    renderAppOverlay();

    fireEvent.click(await screen.findByRole("link", { name: "Bob" }));

    expect(replace).toHaveBeenCalledWith("/bob/collected?address=0x1#items", {
      scroll: true,
    });
  });

  it("leaves external links alone", async () => {
    renderAppOverlay();

    fireEvent.click(await screen.findByRole("link", { name: "External" }));

    expect(replace).not.toHaveBeenCalled();
  });
});
