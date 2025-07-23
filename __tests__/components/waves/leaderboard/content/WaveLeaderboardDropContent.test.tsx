import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDropContent } from "../../../../../components/waves/leaderboard/content/WaveLeaderboardDropContent";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("../../../../../components/waves/drops/WaveDropContent", () => ({
  __esModule: true,
  default: ({ onDropContentClick, drop }: any) => (
    <div data-testid="content" onClick={() => onDropContentClick(drop)} />
  ),
}));
jest.mock("../../../../../components/waves/drops/WaveDropMetadata", () => ({
  __esModule: true,
  default: ({ metadata }: any) => (
    <div data-testid="meta">{metadata.length}</div>
  ),
}));

const routerMock = useRouter as jest.Mock;

describe("WaveLeaderboardDropContent", () => {
  it("navigates on drop click and shows metadata", () => {
    const push = jest.fn();
    routerMock.mockReturnValue({ push });
    const drop = { wave: { id: "w" }, serial_no: 5, metadata: ["m"] } as any;
    render(<WaveLeaderboardDropContent drop={drop} />);
    fireEvent.click(screen.getByTestId("content"));
    expect(push).toHaveBeenCalledWith("/my-stream?wave=w&serialNo=5/");
    expect(screen.getByTestId("meta")).toHaveTextContent("1");
  });
});
