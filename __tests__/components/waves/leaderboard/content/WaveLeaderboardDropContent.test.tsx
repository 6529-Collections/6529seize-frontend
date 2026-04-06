import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDropContent } from "@/components/waves/leaderboard/content/WaveLeaderboardDropContent";
import { useRouter } from "next/navigation";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/components/waves/drops/WaveDropContent", () => ({
  __esModule: true,
  default: ({ onDropContentClick, drop }: any) => (
    <div data-testid="content" onClick={() => onDropContentClick(drop)} />
  ),
}));
jest.mock("@/components/waves/drops/WaveDropMetadata", () => ({
  __esModule: true,
  default: ({ metadata }: any) => (
    <div data-testid="meta">{metadata.length}</div>
  ),
}));
jest.mock("@/components/waves/drops/WaveDropReactions", () => ({
  __esModule: true,
  default: () => <div data-testid="reactions" />,
}));
jest.mock(
  "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity",
  () => ({
    WaveLeaderboardIdentity: () => <div data-testid="identity" />,
  })
);

const routerMock = useRouter as jest.Mock;

describe("WaveLeaderboardDropContent", () => {
  it("navigates on drop click, renders identity, and filters reserved metadata", () => {
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
    expect(screen.getByTestId("identity")).toBeInTheDocument();
    expect(screen.getByTestId("meta")).toHaveTextContent("1");
  });
});
