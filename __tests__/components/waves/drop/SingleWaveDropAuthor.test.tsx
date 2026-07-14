import React from "react";
import { render, screen } from "@testing-library/react";
import { SingleWaveDropAuthor } from "@/components/waves/drop/SingleWaveDropAuthor";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiDropType } from "@/generated/models/ApiDropType";

const mockDropAuthorBadges = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="user-cic-level" />,
  UserCICAndLevelSize: {
    SMALL: "small",
  },
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: unknown) => {
    mockDropAuthorBadges(props);
    return <div data-testid="drop-author-badges" />;
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

describe("SingleWaveDropAuthor", () => {
  const createDrop = (
    handle: string | null,
    primaryAddress: string,
    classification: ApiProfileClassification = ApiProfileClassification.Pseudonym,
    dropType: ApiDropType = ApiDropType.Chat
  ) =>
    ({
      id: "drop-1",
      author: {
        handle,
        primary_address: primaryAddress,
        pfp: null,
        level: 3,
        classification,
      },
      drop_type: dropType,
      wave: { id: "wave-1", name: "Cool Comp" },
    }) as any;

  it("renders the handle when present and uses it for the tooltip lookup", () => {
    render(<SingleWaveDropAuthor drop={createDrop("alice", "0xabc")} />);

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
      "data-user",
      "alice"
    );
  });

  it("renders the primary address when the handle is missing and uses the same tooltip lookup", () => {
    render(
      <SingleWaveDropAuthor
        drop={createDrop(null, "0x1111111111111111111111111111111111111111")}
      />
    );

    expect(
      screen.getByText("0x1111111111111111111111111111111111111111")
    ).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-wrapper")).toHaveAttribute(
      "data-user",
      "0x1111111111111111111111111111111111111111"
    );
  });

  it("renders a robot emoji before the name for AI profiles", () => {
    render(
      <SingleWaveDropAuthor
        drop={createDrop("ai-bot", "0xabc", ApiProfileClassification.Ai)}
      />
    );

    expect(screen.getByText("🤖")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ai profile ai-bot/i })
    ).toBeInTheDocument();
  });

  it("keeps interactive badges outside the profile link", () => {
    render(<SingleWaveDropAuthor drop={createDrop("alice", "0xabc")} />);

    const profileLink = screen.getByRole("link", { name: "alice" });
    expect(profileLink).not.toContainElement(
      screen.getByTestId("drop-author-badges")
    );
  });

  it.each([ApiDropType.Chat, ApiDropType.Participatory, ApiDropType.Winner])(
    "passes the current wave to %s author badges",
    (dropType) => {
      render(
        <SingleWaveDropAuthor
          drop={createDrop(
            "alice",
            "0xabc",
            ApiProfileClassification.Pseudonym,
            dropType
          )}
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
