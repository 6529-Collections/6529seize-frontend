import RoundedManifoldIconButton from "@/components/distribution-plan-tool/common/RoundedManifoldIconButton";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock("@/components/distribution-plan-tool/common/ManifoldIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

describe("RoundedManifoldIconButton", () => {
  it("renders loader when loading and button is disabled", () => {
    const onClick = jest.fn();
    render(<RoundedManifoldIconButton loading={true} onClick={onClick} />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows icon when not loading", () => {
    render(<RoundedManifoldIconButton loading={false} onClick={() => {}} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
