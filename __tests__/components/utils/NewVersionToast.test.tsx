import NewVersionToast from "@/components/utils/NewVersionToast";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/useIsVersionStale", () => ({
  useIsVersionStale: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseIsVersionStale = useIsVersionStale as jest.Mock;
const mockedUseDeviceInfo = useDeviceInfo as jest.Mock;

describe("NewVersionToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.history.replaceState(
      { test: true },
      "",
      "/waves?wave=abc&showNewVersionToast=true"
    );
  });

  it("returns null when not stale", () => {
    mockedUseIsVersionStale.mockReturnValue(false);
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });
    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({ isApp: true });

    const { container } = render(<NewVersionToast />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("newVersionWrapperApp");
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("removes the forced toast query param from the current path on refresh", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });

    render(<NewVersionToast />);
    fireEvent.click(screen.getByRole("button"));

    expect(globalThis.location.pathname).toBe("/waves");
    expect(globalThis.location.search).toBe("?wave=abc");
  });

  it("uses the base wrapper when not in app", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });

    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toHaveClass("newVersionWrapper");
    expect(container.firstChild).not.toHaveClass("newVersionWrapperApp");
  });
});
