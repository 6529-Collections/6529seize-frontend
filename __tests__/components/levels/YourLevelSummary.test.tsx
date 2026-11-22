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

  it("shows the next Level at Level 100", () => {
    renderSummary({ level: 100, rep: 0, tdh: 25_000_000 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level100");
    expect(summary).toHaveTextContent("25,000,000");
    expect(summary).toHaveTextContent("To reach Level 101");
    expect(summary).toHaveTextContent("1,000,000 more TDH + Rep");
  });

  it("shows a Level above 100 and the next Level's threshold", () => {
    renderSummary({ level: 150, rep: 30_000_000, tdh: 150_000_000 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level150");
    expect(summary).toHaveTextContent("180,000,000");
    // Level 151 needs 184,773,695.
    expect(summary).toHaveTextContent("To reach Level 151");
    expect(summary).toHaveTextContent("4,773,695 more TDH + Rep");
  });

  it("does not render invalid profile metrics", () => {
    const { container } = renderSummary({ level: 0, rep: Number.NaN, tdh: 0 });

    expect(container).toBeEmptyDOMElement();
  });

  it("does not render a Level that is not a whole number", () => {
    const { container } = renderSummary({ level: 1.5, rep: 0, tdh: 30 });

    expect(container).toBeEmptyDOMElement();
  });
});
