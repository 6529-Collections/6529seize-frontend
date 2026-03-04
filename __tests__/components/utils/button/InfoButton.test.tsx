import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoButton from "@/components/utils/button/InfoButton";

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

describe("InfoButton", () => {
  it("renders children and fires click handler", async () => {
    const onClick = jest.fn();
    render(<InfoButton onClicked={onClick}>Text</InfoButton>);
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("shows loader and disables when loading", () => {
    render(<InfoButton loading>Text</InfoButton>);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("uses full width by default", () => {
    render(<InfoButton>Text</InfoButton>);
    expect(screen.getByRole("button")).toHaveClass("tw-w-full");
  });

  it("supports custom width and className overrides", () => {
    render(
      <InfoButton fullWidth={false} className="custom-info-button">
        Text
      </InfoButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("tw-w-auto");
    expect(button).toHaveClass("custom-info-button");
  });
});
