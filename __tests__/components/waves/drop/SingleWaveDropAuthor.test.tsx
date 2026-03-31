import React from "react";
import { render, screen } from "@testing-library/react";
import { SingleWaveDropAuthor } from "@/components/waves/drop/SingleWaveDropAuthor";

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
  DropAuthorBadges: () => <div data-testid="drop-author-badges" />,
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
  const createDrop = (handle: string | null, primaryAddress: string) =>
    ({
      id: "drop-1",
      author: {
        handle,
        primary_address: primaryAddress,
        pfp: null,
        level: 3,
      },
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
});
