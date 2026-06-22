import { fireEvent, render, screen } from "@testing-library/react";
import XtdhPage from "@/components/xtdh/XtdhPage";
import { useGlobalTdhStats } from "@/hooks/useGlobalTdhStats";

jest.mock("@/hooks/useGlobalTdhStats");
jest.mock("@/components/xtdh/received", () => ({
  __esModule: true,
  default: () => <div data-testid="xtdh-received-section" />,
}));

const mockUseGlobalTdhStats =
  useGlobalTdhStats as jest.MockedFunction<typeof useGlobalTdhStats>;

describe("XtdhPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a skeleton while stats are loading", () => {
    mockUseGlobalTdhStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<XtdhPage />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("xTDH Network Overview")).toBeInTheDocument();
  });

  it("renders an error state with retry", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockUseGlobalTdhStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      refetch,
    } as any);

    render(<XtdhPage />);

    expect(
      screen.getByText(/unable to load xtdh stats/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("renders network stats when loaded", () => {
    mockUseGlobalTdhStats.mockReturnValue({
      data: {
        tdh: 100,
        tdhRate: 5,
        xtdh: 200,
        xtdhRate: 10,
        xtdhMultiplier: 2,
        grantedXtdhRate: 6,
        grantedXtdh: 12,
        grantedCollectionsCount: 3,
        grantedTokensCount: 4,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<XtdhPage />);

    expect(screen.getByText("xTDH Network Overview")).toBeInTheDocument();
    expect(screen.getByText("TDH Rate")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("6 / 10 granted")).toBeInTheDocument();
    expect(screen.getByTestId("xtdh-received-section")).toBeInTheDocument();
  });
});
