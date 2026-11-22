import YourLevelSummary from "@/components/levels/YourLevelSummary";
import { render, screen } from "@testing-library/react";

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

  it("leaves out the target when the score reaches the next threshold", () => {
    renderSummary({ level: 1, rep: 25, tdh: 25 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level1");
    expect(summary).toHaveTextContent("50");
    expect(summary).not.toHaveTextContent("To reach Level");
    expect(summary).not.toHaveTextContent("more TDH + Rep");
  });

  it("keeps the API's Level 100 when the score is already past Level 101", () => {
    // The API assigns Levels. Before it applies the rule above 100, a score
    // of 30,000,000 still comes back as Level 100.
    renderSummary({ level: 100, rep: 5_000_000, tdh: 25_000_000 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level100");
    expect(summary).toHaveTextContent("30,000,000");
    expect(summary).not.toHaveTextContent("To reach Level");
  });

  it("shows the Level and score without a target from Level 602 up", () => {
    renderSummary({ level: 602, rep: 0, tdh: 8_900_000_000_000_000 });

    const summary = screen.getByRole("region", { name: "Your Level" });
    expect(summary).toHaveTextContent("Your Level602");
    expect(summary).toHaveTextContent("8,900,000,000,000,000");
    expect(summary).not.toHaveTextContent("To reach Level");
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

  it.each([1.5, -1])("does not render Level %p", (level) => {
    const { container } = renderSummary({ level, rep: 0, tdh: 30 });

    expect(container).toBeEmptyDOMElement();
  });
});
