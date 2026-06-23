import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  ParticipationDropVoteDetailsLogRow,
  ParticipationDropVoteDetailsVoterRow,
} from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsRows";

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

const identity = {
  id: "v1",
  handle: "alice",
  primary_address: "0x123",
} as any;

describe("ParticipationDropVoteDetailsRows", () => {
  it("shows signed positive and negative voter amounts", () => {
    const { rerender } = render(
      <ParticipationDropVoteDetailsVoterRow
        voter={{ voter: identity, vote: 100 } as any}
        creditType={ApiWaveCreditType.Tdh}
      />
    );

    expect(screen.getByText("+100 TDH")).toBeInTheDocument();

    rerender(
      <ParticipationDropVoteDetailsVoterRow
        voter={{ voter: identity, vote: -25 } as any}
        creditType={ApiWaveCreditType.Tdh}
      />
    );

    expect(screen.getByText("-25 TDH")).toBeInTheDocument();
  });

  it("shows vote log changes with old and new values", () => {
    render(
      <ParticipationDropVoteDetailsLogRow
        log={{
          id: "l1",
          voter: identity,
          old_vote: -25,
          new_vote: 10,
          created_at: 1_000_000,
        }}
        creditType={ApiWaveCreditType.Tdh}
      />
    );

    expect(screen.getByText("changed")).toBeInTheDocument();
    expect(screen.getByText("-25")).toBeInTheDocument();
    expect(screen.getByText("->")).toBeInTheDocument();
    expect(screen.getByText("+10 TDH")).toBeInTheDocument();
  });

  it("shows first-time votes as voted", () => {
    render(
      <ParticipationDropVoteDetailsLogRow
        log={{
          id: "l1",
          voter: identity,
          old_vote: 0,
          new_vote: 10,
          created_at: 1_000_000,
        }}
        creditType={ApiWaveCreditType.Tdh}
      />
    );

    expect(screen.getByText("voted")).toBeInTheDocument();
    expect(screen.getByText("+10 TDH")).toBeInTheDocument();
  });
});
