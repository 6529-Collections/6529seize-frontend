import YourLevelSummary from "@/components/levels/YourLevelSummary";
import { render, screen, within } from "@testing-library/react";

const renderSummary = (profile: {
  readonly level: number;
  readonly rep: number;
  readonly tdh: number;
}) => render(<YourLevelSummary locale="en-US" profile={profile} />);

describe("YourLevelSummary", () => {
  it("renders a real Level 0 profile without fabricating loading data", () => {
    renderSummary({ level: 0, rep: 0, tdh: 0 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level0");
    expect(summary).toHaveTextContent("To reach Level 1");
    expect(summary).toHaveTextContent("25 more TDH + Rep");
  });

  it("does not report a negative amount at an exact next threshold", () => {
    renderSummary({ level: 1, rep: 25, tdh: 25 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    const target = within(summary).getByText("To reach Level 2").parentElement;
    expect(target).toHaveTextContent("0 more TDH + Rep");
  });

  it("uses the highest-Level state at Level 100", () => {
    renderSummary({ level: 100, rep: 0, tdh: 25_000_000 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level100");
    expect(summary).toHaveTextContent("25,000,000");
    expect(summary).toHaveTextContent("You have reached the highest Level.");
    expect(summary).not.toHaveTextContent("To reach Level");
    expect(summary).not.toHaveTextContent("more TDH + Rep");
  });

  it("does not render invalid profile metrics", () => {
    const { container } = renderSummary({ level: 0, rep: Number.NaN, tdh: 0 });

    expect(container).toBeEmptyDOMElement();
  });
});
