import NewVersionToast from "@/components/utils/NewVersionToast";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/useIsVersionStale", () => ({
  useIsVersionStale: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseIsVersionStale = useIsVersionStale as jest.Mock;
const mockedUseDeviceInfo = useDeviceInfo as jest.Mock;

const mockReload = jest.fn();

describe("NewVersionToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, "location", {
      value: {
        ...globalThis.location,
        reload: mockReload,
      },
      writable: true,
    });
  });

  it("returns null when not stale", () => {
    mockedUseIsVersionStale.mockReturnValue(false);
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });
    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast and refreshes on click", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({ isApp: true });

    const { container } = render(<NewVersionToast />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("tw-bottom-24");
    await userEvent.click(screen.getByRole("button"));
    expect(mockReload).toHaveBeenCalled();
  });

  it("uses bottom-6 class when not in app", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });

    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toHaveClass("tw-bottom-6");
  });
});
