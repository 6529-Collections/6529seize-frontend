import { render } from "@testing-library/react";
// @ts-nocheck
import HeaderUserConnecting from "../../../../components/header/user/HeaderUserConnecting";

const mockLoader = jest.fn();
mockLoader.mockImplementation(() => <div data-testid="loader" />);

jest.mock("../../../../components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: (props: any) => (mockLoader as any)(props),
  CircleLoaderSize: { MEDIUM: "MEDIUM" }
}));

describe("HeaderUserConnecting", () => {
  it("renders a medium CircleLoader inside container", () => {
    const { container, getByTestId } = render(<HeaderUserConnecting />);
    expect(getByTestId("loader")).toBeInTheDocument();
    expect(mockLoader).toHaveBeenCalledWith({ size: "MEDIUM" });
    expect(container.firstChild).toHaveClass("tw-h-11", "tw-w-11", "tw-mr-4");
  });
});
