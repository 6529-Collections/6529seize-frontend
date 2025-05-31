import React from "react";
import { render } from "@testing-library/react";

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

jest.mock("../../../../../components/waves/leaderboard/time/HorizontalTimeline", () => (props: any) => {
  timelineProps = props;
  return <div data-testid="timeline" />;
});

import { ExpandedTimelineContent } from "../../../../../components/waves/leaderboard/time/ExpandedTimelineContent";

describe("ExpandedTimelineContent", () => {
  it("exports component", () => {
    expect(typeof ExpandedTimelineContent).toBe("function");
  });
});
