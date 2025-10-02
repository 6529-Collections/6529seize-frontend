import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";

jest.mock("@/hooks/useIsVersionStale", () => ({
  useIsVersionStale: jest.fn(),
}));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseIsVersionStale = useIsVersionStale as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseDeviceInfo = useDeviceInfo as jest.Mock;

describe("NewVersionToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when not stale", () => {
    mockedUseIsVersionStale.mockReturnValue(false);
    mockedUseRouter.mockReturnValue({ refresh: jest.fn() });
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });
    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast and refreshes on click", async () => {
    const refresh = jest.fn();
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseRouter.mockReturnValue({ refresh });
    mockedUseDeviceInfo.mockReturnValue({ isApp: true });

    const { container } = render(<NewVersionToast />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("tw-bottom-24");
    await userEvent.click(screen.getByRole("button"));
    expect(refresh).toHaveBeenCalled();
  });

  it("uses bottom-6 class when not in app", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseRouter.mockReturnValue({ refresh: jest.fn() });
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });

    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toHaveClass("tw-bottom-6");
  });
});
