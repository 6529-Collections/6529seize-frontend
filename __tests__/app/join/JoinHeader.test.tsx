import { render, screen } from "@testing-library/react";

import { JoinHeader } from "@/app/join/JoinHeader";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/app/join/MemeArtifactCard", () => ({
  MemeArtifactCard: () => <div data-testid="meme-artifact" />,
}));

describe("JoinHeader", () => {
  it("uses the shared primary and secondary actions", () => {
    render(
      <JoinHeader
        locale="en-US"
        pageState="loggedOut"
        primaryAction={{ kind: "button", label: "Connect wallet" }}
        secondaryAction={{
          kind: "link",
          label: "See how it works",
          href: "#journey",
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Connect wallet" })).toHaveClass(
      "tw-min-h-11",
      "tw-rounded-lg",
      "tw-bg-iron-200"
    );
    expect(screen.getByRole("link", { name: "See how it works" })).toHaveClass(
      "tw-min-h-11",
      "tw-rounded-lg",
      "tw-bg-white/[0.07]"
    );
  });

  it("exposes the primary action's loading state", () => {
    render(
      <JoinHeader
        locale="en-US"
        pageState="loggedOut"
        primaryAction={{
          kind: "button",
          label: "Connect wallet",
          busyLabel: "Opening wallet",
          busy: true,
        }}
        secondaryAction={{
          kind: "link",
          label: "See how it works",
          href: "#journey",
        }}
      />
    );

    const primaryAction = screen.getByRole("button", {
      name: "Opening wallet",
    });
    expect(primaryAction).toBeDisabled();
    expect(primaryAction).toHaveAttribute("aria-busy", "true");
  });
});
