import { render, screen } from "@testing-library/react";
import CreateDropParts from "../../../../../../components/drops/create/utils/storm/CreateDropParts";

describe("CreateDropParts", () => {
  it("shows part info when storm mode", () => {
    render(
      <CreateDropParts partsCount={2} currentPartCount={1} charsCount={250} isStormMode={true} />
    );
    expect(screen.getByText(/Part:/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toHaveClass("tw-text-error", { exact: false });
  });

  it("hides info when no parts", () => {
    const { container } = render(
      <CreateDropParts partsCount={0} currentPartCount={1} charsCount={20} isStormMode={true} />
    );
    expect(container.querySelector("p")).toBeNull();
  });
});
