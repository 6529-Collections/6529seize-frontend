import React from "react";
import { render, screen } from "@testing-library/react";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import WaveDropHeader from "@/components/waves/drops/WaveDropHeader";

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

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="user-cic-level" />,
  UserCICAndLevelSize: {
    SMALL: "small",
  },
}));

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ user, children }: any) => (
    <div data-testid="tooltip-wrapper" data-user={user}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => <div data-testid="drop-author-badges" />,
}));

jest.mock("@/components/waves/drops/time/WaveDropTime", () => ({
  __esModule: true,
  default: () => <div data-testid="wave-drop-time" />,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  EllipsisVerticalIcon: () => <div data-testid="ellipsis-icon" />,
}));

jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));

describe("WaveDropHeader", () => {
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
        level: 3,
        classification,
      },
      wave: {
        id: "wave-1",
        name: "Wave Name",
      },
      parts: [],
    }) as any;

  it("renders a robot emoji before the author name for AI profiles", () => {
    render(
      <WaveDropHeader
        drop={createDrop("ai-bot", "0xabc", ApiProfileClassification.Ai)}
        isStorm={false}
        currentPartIndex={0}
        partsCount={1}
        showWaveInfo={false}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveTextContent("🤖ai-bot");
  });

  it("does not render a robot emoji for non-AI profiles", () => {
    render(
      <WaveDropHeader
        drop={createDrop("human", "0xabc", ApiProfileClassification.Pseudonym)}
        isStorm={false}
        currentPartIndex={0}
        partsCount={1}
        showWaveInfo={false}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveTextContent("human");
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveTextContent("🤖");
  });
});
