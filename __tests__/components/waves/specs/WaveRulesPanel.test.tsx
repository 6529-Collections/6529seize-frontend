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
          label: "Who can admin",
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
            <button type="button">21 currently eligible</button>
          ) : undefined
        }
      />
    );

    expect(
      screen.getByRole("button", { name: "21 currently eligible" })
    ).toBeVisible();
    expect(screen.queryByText("Artists")).not.toBeInTheDocument();
    expect(screen.getByText("Private group")).toBeInTheDocument();
  });

  it("shows creator rules before automatic rules when creator rules exist", () => {
    render(
      <WaveRulesPanel
        rules={{
          ...rules,
          custom: {
            binding: null,
            display: "Keep submissions focused on the weekly theme.",
            signatureRequired: false,
          },
        }}
      />
    );

    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent)
    ).toEqual(["Rules", "Creator rules", "Access"]);
  });

  it("keeps the empty creator-rules state after automatic rules", () => {
    render(<WaveRulesPanel rules={rules} />);

    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent)
    ).toEqual(["Rules", "Access", "Creator rules"]);
  });
});
