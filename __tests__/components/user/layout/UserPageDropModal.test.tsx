import UserPageDropModal from "@/components/user/layout/UserPageDropModal";
import { useDropModal } from "@/hooks/useDropModal";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useDropModal", () => ({ useDropModal: jest.fn() }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { headerSpace: 123 } }),
}));
jest.mock("@/components/waves/drop/SingleWaveDrop", () => ({
  SingleWaveDrop: () => <div data-testid="single-artwork" />,
}));

const mockModal = jest.mocked(useDropModal);
const mockDeviceInfo = jest.mocked(useDeviceInfo);

describe("UserPageDropModal", () => {
  beforeEach(() => {
    mockModal.mockReturnValue({
      activeDrop: { id: "artwork" } as NonNullable<
        ReturnType<typeof useDropModal>["activeDrop"]
      >,
      drop: undefined,
      dropId: "artwork",
      isDropOpen: true,
      isLoading: false,
      onDropClose: jest.fn(),
    });
    mockDeviceInfo.mockReturnValue({
      isApp: true,
      isMobileDevice: true,
      hasTouchScreen: true,
      isAppleMobile: true,
    });
  });

  it("opens native profile artwork at the screen top above the app header", () => {
    render(<UserPageDropModal />);
    const overlay = screen.getByTestId("single-artwork").parentElement!;
    expect(overlay.style.top).toBe("0px");
    expect(overlay).toHaveClass("tw-z-[1010]");
  });

  it("keeps web profile artwork below the measured header", () => {
    mockDeviceInfo.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
      isAppleMobile: false,
    });
    render(<UserPageDropModal />);
    const overlay = screen.getByTestId("single-artwork").parentElement!;
    expect(overlay.style.top).toBe("123px");
    expect(overlay).toHaveClass("tw-z-[49]");
  });

  it("restores page scrolling after closing", () => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    const { unmount } = render(<UserPageDropModal />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(bodyOverflow);
    expect(document.documentElement.style.overflow).toBe(htmlOverflow);
  });
});
