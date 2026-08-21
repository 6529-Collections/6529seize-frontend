import { render, screen } from "@testing-library/react";

import { JoinHeader } from "@/app/join/JoinHeader";
import * as pageUtils from "@/app/join/page.utils";

const originalMessage = pageUtils.m;

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the localized subtitle as one sentence with styled emphasis", () => {
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

    const highlight = screen.getByText("chat, vote, and collect together.");
    expect(highlight).toHaveClass("tw-text-iron-50", "md:tw-block");
    expect(highlight.parentElement).toHaveTextContent(
      "A community that decides what to build next chat, vote, and collect together."
    );
    expect(highlight.parentElement).not.toHaveTextContent("<highlight>");
    expect(highlight.parentElement).not.toHaveTextContent("</highlight>");
  });

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

  it.each([
    [
      "Before <highlight>duplicate <highlight>opening</highlight> after.",
      "Before duplicate opening after.",
    ],
    [
      "Before <highlight>duplicate</highlight> closing</highlight> after.",
      "Before duplicate closing after.",
    ],
  ])("strips duplicate subtitle markers from %s", (subtitle, renderedText) => {
    jest.spyOn(pageUtils, "m").mockImplementation((locale, key, params) => {
      if (key === "join6529.hero.loggedOut.subtitle") {
        return subtitle;
      }
      return originalMessage(locale, key, params);
    });

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

    expect(screen.queryByText(/<\/?highlight>/)).not.toBeInTheDocument();
    expect(screen.getByText(renderedText)).toBeVisible();
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
