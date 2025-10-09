import { render, screen } from "@testing-library/react";
import XtdhPage from "@/components/xtdh/XtdhPage";

jest.mock("@/components/xtdh/XtdhStatsOverview", () => ({
  __esModule: true,
  default: () => <div data-testid="xtdh-stats-overview">xTDH stats overview</div>,
}));

describe("XtdhPage", () => {
  it("renders the stats overview section", () => {
    render(<XtdhPage />);

    expect(
      screen.getByTestId("xtdh-stats-overview")
    ).toBeInTheDocument();
  });
});
