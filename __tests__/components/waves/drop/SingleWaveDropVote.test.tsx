import { render, screen } from "@testing-library/react";
import React from "react";
import {
  SingleWaveDropVote,
  SingleWaveDropVoteSize,
} from "@/components/waves/drop/SingleWaveDropVote";
import { SingleWaveDropVoteSubmissionMode } from "@/components/waves/drop/SingleWaveDropVote.types";
import { ApiDropType } from "@/generated/models/ApiDropType";

let capturedProps: any;

jest.mock("next/dynamic", () => () => (props: any) => {
  capturedProps = props;
  return <div data-testid="content" />;
});

const drop: any = {
  id: "d1",
  wave: { id: "wave-1" },
  drop_type: ApiDropType.Participatory,
  competition_context: {
    viewer: null,
    waveId: "wave-1",
    dropId: "d1",
    data: { competition: null, entry: null, vote_summary: null },
  },
};

describe("SingleWaveDropVote", () => {
  it("passes props to dynamic content component", () => {
    const onSuccess = jest.fn();
    render(
      <SingleWaveDropVote
        drop={drop}
        size={SingleWaveDropVoteSize.COMPACT}
        onVoteSuccess={onSuccess}
      />
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(capturedProps).toEqual({
      drop,
      size: SingleWaveDropVoteSize.COMPACT,
      onVoteSuccess: onSuccess,
      onVoteRequestStarted: undefined,
      submissionMode: SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
    });
  });
});
