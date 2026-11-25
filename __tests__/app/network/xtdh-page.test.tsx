import XTDHMainPage from "@/app/network/xtdh/page.client";
import { render, screen } from "@testing-library/react";

const mockXtdhRetirement = jest.fn(() => "live");

jest.mock("@/hooks/useXtdhRetirement", () => ({
  useXtdhRetirement: () => mockXtdhRetirement(),
  useXtdhRetired: () => mockXtdhRetirement() === "retired",
}));
jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <nav data-testid="about-contents" />,
}));
jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

describe("xTDH overview page", () => {
  beforeEach(() => {
    mockXtdhRetirement.mockReturnValue("live");
  });

  it("explains xTDH while it is live, with no notice", () => {
    render(<XTDHMainPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "xTDH Overview" })
    ).toBeInTheDocument();
    expect(screen.getByText(/xTDH_coefficient is currently set/)).toBeVisible();
    expect(screen.queryByTestId("xtdh-retired-notice")).toBeNull();
  });

  it("keeps the explainer under the notice on the freeze day", () => {
    mockXtdhRetirement.mockReturnValue("closing");

    render(<XTDHMainPage />);

    expect(screen.getByTestId("xtdh-retired-notice")).toHaveTextContent(
      "Grants can't be created or changed."
    );
    expect(screen.getByText(/xTDH_coefficient is currently set/)).toBeVisible();
  });

  it("shows only the notice once xTDH is retired", () => {
    mockXtdhRetirement.mockReturnValue("retired");

    render(<XTDHMainPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "xTDH Overview" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("xtdh-retired-notice")).toHaveTextContent(
      "xTDH was retired when identities moved to the 6529 Network."
    );
    expect(screen.queryByText(/xTDH_coefficient/)).toBeNull();
    expect(screen.queryByText(/increases every day at midnight/)).toBeNull();
    expect(screen.queryByText(/via grants/)).toBeNull();
    expect(screen.getByTestId("about-contents")).toBeInTheDocument();
  });
});
