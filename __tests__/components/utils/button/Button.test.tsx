import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <span data-testid="button-loader" />,
}));

describe("Button", () => {
  it("uses the shared primary and medium styles by default", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass(
      "tw-h-10",
      "tw-rounded-lg",
      "tw-bg-iron-200",
      "tw-ring-1",
      "tw-ring-inset"
    );

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables interaction and exposes its busy state while loading", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <Button
        aria-label="Saving changes"
        loading
        hideChildrenWhenLoading
        onClick={onClick}
      >
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Saving changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("button-loader")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ButtonLink", () => {
  it("shares variants and sizes with buttons", () => {
    render(
      <ButtonLink href="/waves" variant="secondary" size="lg">
        Explore waves
      </ButtonLink>
    );

    const link = screen.getByRole("link", { name: "Explore waves" });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link).toHaveClass(
      "tw-min-h-11",
      "tw-rounded-lg",
      "tw-bg-white/[0.07]"
    );
    expect(link).not.toHaveClass("tw-ring-1");
    expect(link).not.toHaveClass("tw-ring-inset");
    expect(link.className).not.toMatch(/\s$/);
  });
});
