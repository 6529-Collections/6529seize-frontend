import React from "react";
import { render, screen } from "@testing-library/react";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import DropMinimalIdentityRow from "@/components/waves/drops/DropMinimalIdentityRow";

const mockDropAuthorBadges = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ user, children }: any) => (
    <div data-testid="tooltip-wrapper" data-user={user}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/drops/time/WaveDropTime", () => ({
  __esModule: true,
  default: () => <div data-testid="wave-drop-time" />,
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: any) => {
    mockDropAuthorBadges(props);
    return <div data-testid="drop-author-badges" />;
  },
}));

describe("DropMinimalIdentityRow", () => {
  const createDrop = (
    handle: string | null,
    primaryAddress: string,
    classification: ApiProfileClassification
  ) =>
    ({
      id: "drop-1",
      created_at: 1710000000000,
      author: {
        id: "profile-1",
        handle,
        primary_address: primaryAddress,
        classification,
      },
      wave: { id: "wave-1", name: "Wave One" },
    }) as any;

  it("renders a robot emoji before the author name for AI profiles", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop("ai-bot", "0xabc", ApiProfileClassification.Ai)}
      />
    );

    expect(screen.getByText("🤖")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ai profile ai-bot/i })
    ).toBeInTheDocument();
  });

  it("does not render a robot emoji for non-AI profiles", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop("human", "0xabc", ApiProfileClassification.Pseudonym)}
      />
    );

    expect(screen.getByRole("link", { name: "human" })).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveTextContent("🤖");
  });

  it("uses the handle for the tooltip lookup when present", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop("alice", "0xabc", ApiProfileClassification.Pseudonym)}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
      "data-user",
      "alice"
    );
    expect(mockDropAuthorBadges).toHaveBeenLastCalledWith(
      expect.objectContaining({
        wave: expect.objectContaining({ id: "wave-1" }),
      })
    );
  });

  it("uses the primary address for the tooltip lookup when the handle is missing", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop(
          null,
          "0x1111111111111111111111111111111111111111",
          ApiProfileClassification.Pseudonym
        )}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "0x1111111111111111111111111111111111111111",
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
      "data-user",
      "0x1111111111111111111111111111111111111111"
    );
  });
});
