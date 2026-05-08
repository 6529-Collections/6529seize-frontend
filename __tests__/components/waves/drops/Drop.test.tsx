import { render, screen } from "@testing-library/react";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import React from "react";

let participationProps: any;

jest.mock(
  "@/components/waves/drops/participation/ParticipationDrop",
  () => (props: any) => {
    participationProps = props;
    return <div data-testid="participation">{props.drop.id}</div>;
  }
);
jest.mock("@/components/waves/drops/winner/WinnerDrop", () => (props: any) => (
  <div data-testid="winner">{props.drop.id}</div>
));
jest.mock("@/components/waves/drops/WaveDrop", () => (props: any) => (
  <div data-testid="wave">{props.drop.id}</div>
));

const base = {
  id: "1",
  drop_type: ApiDropType.Chat,
} as any;

beforeEach(() => {
  participationProps = undefined;
});

it("renders chat drop", () => {
  render(
    <Drop
      drop={base}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={false}
      activeDrop={null}
      location={DropLocation.WAVE}
      dropViewDropId={null}
      onReply={jest.fn()}
      onQuote={jest.fn()}
      onReplyClick={jest.fn()}
      onQuoteClick={jest.fn()}
      showReplyAndQuote={false}
    />
  );
  expect(screen.getByTestId("wave")).toBeInTheDocument();
});

it("renders winner drop", () => {
  const drop = { ...base, drop_type: ApiDropType.Winner };
  render(
    <Drop
      drop={drop}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={false}
      activeDrop={null}
      location={DropLocation.WAVE}
      dropViewDropId={null}
      onReply={jest.fn()}
      onQuote={jest.fn()}
      onReplyClick={jest.fn()}
      onQuoteClick={jest.fn()}
      showReplyAndQuote={false}
    />
  );
  expect(screen.getByTestId("winner")).toBeInTheDocument();
});

it("passes approve wave state to participation drop", () => {
  const drop = { ...base, drop_type: ApiDropType.Participatory };
  render(
    <Drop
      drop={drop}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={false}
      activeDrop={null}
      location={DropLocation.WAVE}
      dropViewDropId={null}
      onReply={jest.fn()}
      onQuote={jest.fn()}
      onReplyClick={jest.fn()}
      onQuoteClick={jest.fn()}
      showReplyAndQuote={false}
      winningThreshold={15}
      isVotingClosed={true}
      isVotingControlsLocked={true}
    />
  );
  expect(screen.getByTestId("participation")).toBeInTheDocument();
  expect(participationProps.winningThreshold).toBe(15);
  expect(participationProps.isVotingClosed).toBe(true);
  expect(participationProps.isVotingControlsLocked).toBe(true);
});
