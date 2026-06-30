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
        multiplier: 2,
        xtdhRate: 10,
        outgoingRate: 6,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<XtdhPage />);

    expect(screen.getByText("xTDH Network Overview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "What is xTDH" })).toHaveAttribute(
      "href",
      "/network/xtdh"
    );
    expect(screen.getByText("Multiplier")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("xTDH Rate")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Granted")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByTestId("xtdh-received-section")).toBeInTheDocument();
  });
});
