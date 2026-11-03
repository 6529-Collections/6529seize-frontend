import UserPageDropModal from "@/components/user/layout/UserPageDropModal";
import { useDropModal } from "@/hooks/useDropModal";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { act, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/hooks/useDropModal", () => ({ useDropModal: jest.fn() }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { headerSpace: 123 } }),
}));
// Counts evaluations of the single drop view module, which stands for fetching
// its chunk. The modal loads it on demand, so the chunk must not be fetched
// until a drop is requested.
let mockSingleWaveDropEvaluations = 0;
jest.mock("@/components/waves/drop/SingleWaveDrop", () => {
  mockSingleWaveDropEvaluations += 1;
  return {
    SingleWaveDrop: () => <div data-testid="single-artwork" />,
  };
});

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

  // The two tests below share the module registry with the rest of the file on
  // purpose: they must run while the view chunk is still unloaded.
  it("does not fetch the single drop view until a drop is requested", async () => {
    mockModal.mockReturnValue({
      activeDrop: undefined,
      drop: undefined,
      dropId: undefined,
      isDropOpen: false,
      isLoading: false,
      onDropClose: jest.fn(),
    });

    const { container } = render(<UserPageDropModal />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container).toBeEmptyDOMElement();
    expect(mockSingleWaveDropEvaluations).toBe(0);
  });

  it("fetches the view while the requested drop is still loading", async () => {
    mockModal.mockReturnValue({
      activeDrop: undefined,
      drop: undefined,
      dropId: "artwork",
      isDropOpen: false,
      isLoading: true,
      onDropClose: jest.fn(),
    });

    const { container } = render(<UserPageDropModal />);

    await waitFor(() => expect(mockSingleWaveDropEvaluations).toBe(1));
    expect(container).toBeEmptyDOMElement();
  });

  it("opens native profile artwork at the screen top above the app header", async () => {
    render(<UserPageDropModal />);
    const overlay = (await screen.findByTestId("single-artwork"))
      .parentElement!;
    expect(overlay.style.top).toBe("0px");
    expect(overlay).toHaveClass("tw-z-[1010]");
  });

  it("keeps web profile artwork below the measured header", async () => {
    mockDeviceInfo.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
      isAppleMobile: false,
    });
    render(<UserPageDropModal />);
    const overlay = (await screen.findByTestId("single-artwork"))
      .parentElement!;
    expect(overlay.style.top).toBe("123px");
    expect(overlay).toHaveClass("tw-z-[49]");
  });

  it("restores page scrolling after closing", async () => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    const { unmount } = render(<UserPageDropModal />);
    await screen.findByTestId("single-artwork");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(bodyOverflow);
    expect(document.documentElement.style.overflow).toBe(htmlOverflow);
  });
});
