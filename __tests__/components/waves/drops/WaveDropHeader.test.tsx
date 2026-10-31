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
  ShieldCheckIcon: () => <svg data-testid="outlined-seal" />,
}));

jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));

let mockSignedMessagesEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockSignedMessagesEnabled,
}));

jest.mock("@/components/waves/drops/signature/DropSignatureDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock(
  "@/components/waves/drops/signature/DropGroupSignatureDialog",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

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

  it("does not render an author profile link, tooltip or level for anonymous submissions", () => {
    const drop = createDrop("alice", "0xabc", ApiProfileClassification.Ai);
    drop.author.is_anonymous = true;
    render(
      <WaveDropHeader
        drop={drop}
        isStorm={false}
        currentPartIndex={0}
        partsCount={1}
        showWaveInfo={false}
      />
    );
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tooltip-wrapper")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-cic-level")).not.toBeInTheDocument();
    expect(screen.queryByText("🤖")).not.toBeInTheDocument();
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
  describe("author signed seal", () => {
    const signedDrop = () => ({
      ...createDrop("alice", "0xabc", ApiProfileClassification.Pseudonym),
      is_author_signed: true,
    });
    const seal = () =>
      screen.queryByRole("button", { name: "Signed by its author" });

    beforeEach(() => {
      mockSignedMessagesEnabled = true;
    });

    it.each(["inline", "stacked"] as const)(
      "sits beside the %s timestamp of an author signed drop",
      (timestampLayout) => {
        render(
          <WaveDropHeader
            drop={signedDrop()}
            isStorm={false}
            currentPartIndex={0}
            partsCount={1}
            showWaveInfo={false}
            timestampLayout={timestampLayout}
          />
        );

        expect(seal()?.parentElement).toContainElement(
          screen.getByTestId("wave-drop-time")
        );
      }
    );

    it("is absent for unsigned drops and while signed messages are off", () => {
      const { rerender } = render(
        <WaveDropHeader
          drop={createDrop(
            "alice",
            "0xabc",
            ApiProfileClassification.Pseudonym
          )}
          isStorm={false}
          currentPartIndex={0}
          partsCount={1}
          showWaveInfo={false}
        />
      );
      expect(seal()).not.toBeInTheDocument();

      mockSignedMessagesEnabled = false;
      rerender(
        <WaveDropHeader
          drop={signedDrop()}
          isStorm={false}
          currentPartIndex={0}
          partsCount={1}
          showWaveInfo={false}
        />
      );
      expect(seal()).not.toBeInTheDocument();
      expect(screen.getByTestId("wave-drop-time")).toBeInTheDocument();
    });

    it("stands for the whole group of posts under a chat header", () => {
      const header = signedDrop();
      const unsigned = {
        ...signedDrop(),
        id: "drop-2",
        is_author_signed: false,
      };
      render(
        <WaveDropHeader
          drop={header}
          signatureGroup={[header, unsigned, { ...header, id: "drop-3" }]}
          isStorm={false}
          currentPartIndex={0}
          partsCount={1}
          showWaveInfo={false}
        />
      );

      expect(seal()).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "2 of 3 posts signed by their author",
        })
      ).toBeInTheDocument();
    });
  });
});
