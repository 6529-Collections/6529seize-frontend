import React from "react";
import { render, screen } from "@testing-library/react";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropHeader from "@/components/waves/drops/WaveDropHeader";

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
  DropAuthorBadges: (props: unknown) => {
    mockDropAuthorBadges(props);
    return <div data-testid="drop-author-badges" />;
  },
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
    classification: ApiProfileClassification,
    dropType: ApiDropType = ApiDropType.Chat
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
      drop_type: dropType,
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

    expect(screen.getByText("🤖")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ai profile ai-bot/i })
    ).toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: "human" })).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).not.toHaveTextContent("🤖");
  });

  it("uses the handle for the tooltip lookup when present", () => {
    render(
      <WaveDropHeader
        drop={createDrop("alice", "0xabc", ApiProfileClassification.Pseudonym)}
        isStorm={false}
        currentPartIndex={0}
        partsCount={1}
        showWaveInfo={false}
      />
    );

    expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
      "data-user",
      "alice"
    );
  });

  it("uses the primary address for the tooltip lookup when the handle is missing", () => {
    render(
      <WaveDropHeader
        drop={createDrop(
          null,
          "0x1111111111111111111111111111111111111111",
          ApiProfileClassification.Pseudonym
        )}
        isStorm={false}
        currentPartIndex={0}
        partsCount={1}
        showWaveInfo={false}
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

  it.each([ApiDropType.Chat, ApiDropType.Participatory, ApiDropType.Winner])(
    "passes the current wave to %s author badges",
    (dropType) => {
      render(
        <WaveDropHeader
          drop={createDrop(
            "alice",
            "0xabc",
            ApiProfileClassification.Pseudonym,
            dropType
          )}
          isStorm={false}
          currentPartIndex={0}
          partsCount={1}
          showWaveInfo={false}
        />
      );

      expect(mockDropAuthorBadges).toHaveBeenLastCalledWith(
        expect.objectContaining({
          wave: expect.objectContaining({ id: "wave-1" }),
        })
      );
    }
  );
});
