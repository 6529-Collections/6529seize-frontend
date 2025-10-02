import React from "react";
import { render, act } from "@testing-library/react";

let divProps: any = {};
let timelineProps: any = {};

jest.mock("framer-motion", () => ({
  __esModule: true,
  motion: {
    div: (props: any) => {
      divProps = props;
      return <div {...props} />;
    },
  },
}));

jest.mock("@/components/waves/leaderboard/time/HorizontalTimeline", () => ({
  HorizontalTimeline: (props: any) => {
    timelineProps = props;
    return <div data-testid="timeline" />;
  }
}));

import { ExpandedTimelineContent } from "@/components/waves/leaderboard/time/ExpandedTimelineContent";

describe("ExpandedTimelineContent", () => {
  beforeEach(() => {
    divProps = {};
    timelineProps = {};
  });

  it("exports component", () => {
    expect(typeof ExpandedTimelineContent).toBe("function");
  });

  it("passes props to HorizontalTimeline and toggles animationComplete", () => {
    const decisions = [{ id: "1" }] as any;
    render(
      <ExpandedTimelineContent decisions={decisions} nextDecisionTime={5} />
    );

    // initial state from first render
    expect(timelineProps.decisions).toBe(decisions);
    expect(timelineProps.nextDecisionTime).toBe(5);
    expect(timelineProps.animationComplete).toBe(false);

    act(() => {
      divProps.onAnimationComplete();
    });

    expect(timelineProps.animationComplete).toBe(true);
  });
});
