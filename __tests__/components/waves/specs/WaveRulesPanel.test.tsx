import WaveRulesPanel from "@/components/waves/specs/WaveRulesPanel";
import type { WaveRules } from "@/helpers/waves/wave-rules.helpers";
import type Link from "next/link";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: ComponentProps<typeof Link>) => (
    <a href={href.toString()} {...props}>
      {children}
    </a>
  ),
}));

const rules: WaveRules = {
  automatic: [
    {
      id: "access",
      title: "Access",
      rows: [
        {
          id: "chat-access",
          label: "Chat access",
          value: "Artists",
          valueHref: "/network?page=1&group=artists",
          valueLinkLabel: "Inspect Artists group criteria and members",
        },
        {
          id: "admin",
          label: "Admins",
          value: "Private group",
        },
      ],
    },
  ],
  custom: {
    binding: null,
    display: null,
    signatureRequired: false,
  },
};

describe("WaveRulesPanel", () => {
  it("renders visible groups as accessible links and private groups as text", () => {
    render(<WaveRulesPanel rules={rules} showCustomRules={false} />);

    const link = screen.getByRole("link", {
      name: "Inspect Artists group criteria and members",
    });
    expect(link).toHaveAttribute("href", "/network?page=1&group=artists");
    expect(link).toHaveClass("tw-min-h-11");
    expect(link).toHaveClass("desktop-hover:hover:tw-text-primary-300");
    expect(link.closest("dd")?.parentElement).toHaveClass("tw-items-center");
    expect(screen.getByText("Private group")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("supports an interactive value for a create-wave rule row", () => {
    render(
      <WaveRulesPanel
        rules={rules}
        showCustomRules={false}
        renderRowValue={(row) =>
          row.id === "chat-access" ? (
            <button type="button">21 users</button>
          ) : undefined
        }
      />
    );

    expect(screen.getByRole("button", { name: "21 users" })).toBeVisible();
    expect(screen.queryByText("Artists")).not.toBeInTheDocument();
    expect(screen.getByText("Private group")).toBeInTheDocument();
  });

  it("shows display guidelines without a display-only label", () => {
    render(
      <WaveRulesPanel
        rules={{
          ...rules,
          custom: {
            ...rules.custom,
            display: "There are some guidelines",
          },
        }}
        showTitle={false}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Guidelines" })
    ).toBeVisible();
    expect(screen.getByText("There are some guidelines")).toBeVisible();
    expect(screen.queryByText("Display only")).not.toBeInTheDocument();
    expect(screen.queryByText("Creator rules")).not.toBeInTheDocument();
  });

  it("keeps the requires-acceptance label for binding rules", () => {
    render(
      <WaveRulesPanel
        rules={{
          ...rules,
          custom: {
            binding: "I certify that I accept these rules.",
            display: null,
            signatureRequired: true,
          },
        }}
        showTitle={false}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Guidelines" })
    ).toBeVisible();
    expect(screen.getByText("Requires acceptance")).toBeVisible();
    expect(
      screen.getByText("I certify that I accept these rules.")
    ).toBeVisible();
    expect(
      screen.getByText(
        "Participants sign these rules with their wallet before submitting."
      )
    ).toBeVisible();
  });
});
