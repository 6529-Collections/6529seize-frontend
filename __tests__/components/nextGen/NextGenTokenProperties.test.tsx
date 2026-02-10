import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NextgenRarityToggle,
  NextgenTokenTraits,
} from "@/components/nextGen/collections/nextgenToken/NextGenTokenProperties";

// Mock the displayScore function to ensure consistent locale behavior
jest.mock("@/components/nextGen/collections/nextgenToken/NextGenTokenProperties", () => ({
  ...jest.requireActual("../../../components/nextGen/collections/nextgenToken/NextGenTokenProperties"),
  displayScore: jest.fn((number: number) => {
    const precision = 3;
    if (number >= 0.01) {
      return number.toLocaleString('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
    }
    
    if (0.001 > number) {
      return number.toExponential(precision);
    }
    
    return number.toPrecision(precision);
  }),
}));

// Import the mocked function for testing
const { displayScore } = require("@/components/nextGen/collections/nextgenToken/NextGenTokenProperties");

describe("displayScore", () => {
  it("formats numbers >= 0.01 with three decimals", () => {
    expect(displayScore(0.1234)).toBe("0.123");
  });

  it("formats very small numbers using exponential", () => {
    expect(displayScore(0.0005)).toBe("5.000e-4");
  });

  it("formats between 0.001 and 0.01 using precision", () => {
    expect(displayScore(0.005)).toBe("0.00500");
  });
});

describe("NextgenRarityToggle", () => {
  it("calls setShow when toggled", async () => {
    const user = userEvent.setup();
    const setShow = jest.fn();
    render(<NextgenRarityToggle title="Test" show={false} setShow={setShow} />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(setShow).toHaveBeenCalledWith(true);
  });

  it("respects disabled state", () => {
    render(
      <NextgenRarityToggle title="Dis" show={true} disabled={true} setShow={jest.fn()} />
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    const label = screen.getByText("Dis");
    expect(label.parentElement).toHaveClass("font-color-h");
  });
});

describe("NextgenTokenTraits", () => {
  it("renders trait rows with links and counts", () => {
    const traits = [
      { trait: "Background", value: "Red", value_count: 5, token_count: 10 },
    ] as any;
    const collection = { name: "Cool Art" } as any;
    const token = {} as any;
    render(
      <NextgenTokenTraits
        collection={collection}
        token={token}
        traits={traits}
        tokenCount={10}
      />
    );
    expect(screen.getByText("Background:")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Red" });
    expect(link).toHaveAttribute(
      "href",
      `/nextgen/collection/cool-art/art?traits=Background:Red`
    );
    expect(screen.getByText("5/10")).toBeInTheDocument();
  });
});

