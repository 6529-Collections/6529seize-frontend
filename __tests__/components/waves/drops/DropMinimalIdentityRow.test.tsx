import React from "react";
import { render, screen } from "@testing-library/react";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import DropMinimalIdentityRow from "@/components/waves/drops/DropMinimalIdentityRow";

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
    }) as any;

  it("renders a robot emoji before the author name for AI profiles", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop("ai-bot", "0xabc", ApiProfileClassification.Ai)}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveTextContent("🤖ai-bot");
  });

  it("does not render a robot emoji for non-AI profiles", () => {
    render(
      <DropMinimalIdentityRow
        drop={createDrop("human", "0xabc", ApiProfileClassification.Pseudonym)}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveTextContent("human");
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveTextContent("🤖");
  });
});
