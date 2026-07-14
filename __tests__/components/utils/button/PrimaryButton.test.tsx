import { render, screen } from "@testing-library/react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

const renderPrimaryButton = (
  props: Partial<React.ComponentProps<typeof PrimaryButton>> = {}
) =>
  render(
    <PrimaryButton
      loading={false}
      disabled={false}
      onClicked={jest.fn()}
      {...props}
    >
      Button
    </PrimaryButton>
  );

describe("PrimaryButton", () => {
  it("uses default text size and padding", () => {
    renderPrimaryButton();

    const button = screen.getByRole("button", { name: "Button" });
    expect(button).toHaveClass("tw-text-sm");
    expect(button).toHaveClass("tw-px-3.5");
    expect(button).toHaveClass("tw-py-2.5");
  });

  it("uses small text size and padding", () => {
    renderPrimaryButton({ size: "sm" });

    const button = screen.getByRole("button", { name: "Button" });
    expect(button).toHaveClass("tw-text-xs");
    expect(button).not.toHaveClass("tw-text-sm");
    expect(button).toHaveClass("tw-px-2.5");
    expect(button).toHaveClass("tw-py-2");
  });

  it("keeps small text size when custom padding is provided", () => {
    renderPrimaryButton({ size: "sm", padding: "tw-px-4 tw-py-1" });

    const button = screen.getByRole("button", { name: "Button" });
    expect(button).toHaveClass("tw-text-xs");
    expect(button).not.toHaveClass("tw-text-sm");
    expect(button).toHaveClass("tw-px-4");
    expect(button).toHaveClass("tw-py-1");
    expect(button).not.toHaveClass("tw-px-2.5");
  });

  it("uses native link behavior when an href is provided", () => {
    renderPrimaryButton({ href: "/profile/subscriptions" });

    expect(screen.queryByRole("button", { name: "Button" })).toBeNull();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
      "href",
      "/profile/subscriptions"
    );
  });
});
