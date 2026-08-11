import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDropContent } from "@/components/waves/leaderboard/content/WaveLeaderboardDropContent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
const waveDropContentMock = jest.fn((props: any) => (
  <div
    data-testid="content"
    onClick={() => props.onDropContentClick(props.drop)}
  />
));
jest.mock("@/components/waves/drops/WaveDropContent", () => ({
  __esModule: true,
  default: (props: any) => waveDropContentMock(props),
}));
jest.mock("@/components/waves/drops/WaveDropReactions", () => ({
  __esModule: true,
  default: () => <div data-testid="reactions" />,
}));

const routerMock = useRouter as jest.Mock;
const pathnameMock = usePathname as jest.Mock;
const searchParamsMock = useSearchParams as jest.Mock;

describe("WaveLeaderboardDropContent", () => {
  beforeEach(() => {
    waveDropContentMock.mockClear();
    pathnameMock.mockReturnValue("/waves/w");
    searchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("navigates on drop click and renders reactions", () => {
    const push = jest.fn();
    routerMock.mockReturnValue({ push });
    const drop = {
      wave: {
        id: "w",
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
      serial_no: 5,
      metadata: [
        { data_key: "identity", data_value: "0xabc" },
        { data_key: "title", data_value: "m" },
      ],
    } as any;
    render(<WaveLeaderboardDropContent drop={drop} />);
    fireEvent.click(screen.getByTestId("content"));
    expect(push).toHaveBeenCalledWith("/waves/w?serialNo=5");
    expect(screen.getByTestId("reactions")).toBeInTheDocument();
  });

  it("forwards custom content presentation to the shared drop content", () => {
    routerMock.mockReturnValue({ push: jest.fn() });
    const drop = {
      wave: { id: "w" },
      serial_no: 5,
      metadata: [],
    } as any;

    render(
      <WaveLeaderboardDropContent
        drop={drop}
        contentPresentation="quorumCompact"
      />
    );

    expect(waveDropContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("renders proposal cards with a working full-detail action", () => {
    const push = jest.fn();
    routerMock.mockReturnValue({ push });
    const drop = {
      id: "drop-1",
      title: null,
      wave: { id: "w" },
      serial_no: 5,
      metadata: [],
      parts_count: 1,
      parts: [
        {
          part_id: 1,
          content: "Proposal title\n\nProposal body",
          media: [],
          attachments: [],
        },
      ],
      nft_links: [],
    } as any;

    render(
      <WaveLeaderboardDropContent
        drop={drop}
        contentPresentation="proposalCard"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Proposal title" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Read full: Proposal title" })
    );

    expect(push).toHaveBeenCalledWith("/waves/w?drop=drop-1");
  });
});
