import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDatesRank from "@/components/waves/create-wave/dates/CreateWaveDatesRank";
import { adjustDatesAfterSubmissionChange } from "@/components/waves/create-wave/services/waveDecisionService";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { Time } from "@/helpers/time";

jest.mock(
  "@/components/waves/create-wave/dates/StartDates",
  () => (props: any) => (
    <button
      data-testid="start"
      data-expanded={props.isExpanded}
      onClick={() => {
        props.setIsExpanded();
        props.setDates({
          ...props.dates,
          submissionStartDate: 50,
          votingStartDate: 50,
        });
      }}
    >
      start
    </button>
  )
);

jest.mock(
  "@/components/waves/create-wave/dates/Decisions",
  () => (props: any) => (
    <>
      <button
        data-testid="decisions"
        data-expanded={props.isExpanded}
        data-error-count={String(props.errors.length)}
        data-has-rank-error={String(
          props.errors.includes("RANK_DECISION_TIME_MUST_BE_IN_FUTURE")
        )}
        data-has-end-before-voting-error={String(
          props.errors.includes("END_DATE_MUST_BE_AFTER_VOTING_START_DATE")
        )}
        data-has-first-before-voting-error={String(
          props.errors.includes(
            "RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE"
          )
        )}
        onClick={() => {
          props.onInteraction();
        }}
      >
        decisions
      </button>
      <button
        data-testid="enable-rolling"
        onClick={() => {
          props.onRollingEnabled();
          props.setDates({
            ...props.dates,
            isRolling: true,
            endDate: null,
            subsequentDecisions: [1],
          });
        }}
      >
        enable rolling
      </button>
    </>
  )
);

jest.mock(
  "@/components/waves/create-wave/dates/RollingEndDate",
  () => (props: any) => (
    <div
      data-testid="rolling"
      data-expanded={props.isExpanded}
      data-error-count={String(props.errors.length)}
      data-has-rank-error={String(
        props.errors.includes("RANK_DECISION_TIME_MUST_BE_IN_FUTURE")
      )}
      data-has-end-before-voting-error={String(
        props.errors.includes("END_DATE_MUST_BE_AFTER_VOTING_START_DATE")
      )}
      data-has-first-before-voting-error={String(
        props.errors.includes(
          "RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE"
        )
      )}
    />
  )
);

jest.mock("@/components/waves/create-wave/services/waveDecisionService", () => {
  const actual = jest.requireActual(
    "@/components/waves/create-wave/services/waveDecisionService"
  );

  return {
    ...actual,
    adjustDatesAfterSubmissionChange: jest.fn((d, ts) => ({
      ...d,
      submissionStartDate: ts,
      votingStartDate: ts,
      firstDecisionTime: ts,
    })),
    calculateEndDate: jest.fn(() => 123),
    validateDateSequence: jest.fn(() => []),
  };
});

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: 10,
  votingStartDate: 20,
  endDate: null,
  firstDecisionTime: 30,
  subsequentDecisions: [],
  isRolling: false,
};

describe("CreateWaveDatesRank", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adjusts dates when submission start changes", async () => {
    const setDates = jest.fn();
    const adjustDatesAfterSubmissionChangeMock = jest.mocked(
      adjustDatesAfterSubmissionChange
    );
    const user = userEvent.setup();
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByTestId("start"));
    expect(adjustDatesAfterSubmissionChangeMock).toHaveBeenCalledWith(
      baseDates,
      50
    );
    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      submissionStartDate: 50,
      votingStartDate: 50,
      firstDecisionTime: 50,
      endDate: 123,
    });
  });

  it("shows rolling section when rolling mode and decisions present", () => {
    const dates = { ...baseDates, isRolling: true, subsequentDecisions: [1] };
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rolling")).toBeInTheDocument();
  });

  it("hides rolling section when not rolling", () => {
    const dates = { ...baseDates, subsequentDecisions: [1], isRolling: false };
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.queryByTestId("rolling")).toBeNull();
  });

  it("does not push date updates on initial render", () => {
    const setDates = jest.fn();
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[]}
        setDates={setDates}
      />
    );

    expect(setDates).not.toHaveBeenCalled();
  });

  it("passes errors to the decisions section", () => {
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-error-count",
      "1"
    );
  });

  it("routes rolling end-date future errors to the rolling section", () => {
    jest.spyOn(Time, "currentMillis").mockReturnValue(1_000);
    const dates = {
      ...baseDates,
      firstDecisionTime: 2_000,
      endDate: 999,
      subsequentDecisions: [100],
      isRolling: true,
    };

    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-has-rank-error",
      "false"
    );
    expect(screen.getByTestId("rolling")).toHaveAttribute(
      "data-has-rank-error",
      "true"
    );
  });

  it("routes fixed rank end-before-voting errors to the decisions section", () => {
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-has-end-before-voting-error",
      "true"
    );
    expect(screen.queryByTestId("rolling")).toBeNull();
  });

  it("routes rolling end-before-voting errors to the rolling section", () => {
    const dates = {
      ...baseDates,
      endDate: 10,
      subsequentDecisions: [100],
      isRolling: true,
    };

    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-has-end-before-voting-error",
      "false"
    );
    expect(screen.getByTestId("rolling")).toHaveAttribute(
      "data-has-end-before-voting-error",
      "true"
    );
  });

  it("routes first-decision-before-voting errors to decisions for rolling waves", () => {
    const dates = {
      ...baseDates,
      endDate: null,
      subsequentDecisions: [100],
      isRolling: true,
    };

    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_FIRST_DECISION_TIME_MUST_BE_AFTER_OR_EQUAL_TO_VOTING_START_DATE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-has-first-before-voting-error",
      "true"
    );
    expect(screen.getByTestId("rolling")).toHaveAttribute(
      "data-has-first-before-voting-error",
      "false"
    );
  });

  it("routes rank future-date errors to both sections when both dates are past", () => {
    jest.spyOn(Time, "currentMillis").mockReturnValue(1_000);
    const dates = {
      ...baseDates,
      firstDecisionTime: 999,
      endDate: 999,
      subsequentDecisions: [100],
      isRolling: true,
    };

    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-has-rank-error",
      "true"
    );
    expect(screen.getByTestId("rolling")).toHaveAttribute(
      "data-has-rank-error",
      "true"
    );
  });

  it("auto collapses start section after decisions interaction", async () => {
    const user = userEvent.setup();
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("start")).toHaveAttribute(
      "data-expanded",
      "true"
    );
    await user.click(screen.getByTestId("decisions"));
    expect(screen.getByTestId("start")).toHaveAttribute(
      "data-expanded",
      "false"
    );
  });

  it("opens the rolling section when rolling mode is enabled", async () => {
    const user = userEvent.setup();
    let dates: CreateWaveDatesConfig = {
      ...baseDates,
      subsequentDecisions: [1],
    };
    let view!: ReturnType<typeof render>;

    const setDates = (nextDates: CreateWaveDatesConfig) => {
      dates = nextDates;
      view.rerender(
        <CreateWaveDatesRank
          waveType={ApiWaveType.Rank}
          dates={dates}
          errors={[]}
          setDates={setDates}
        />
      );
    };

    view = render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={dates}
        errors={[]}
        setDates={setDates}
      />
    );

    expect(screen.queryByTestId("rolling")).toBeNull();

    await user.click(screen.getByTestId("enable-rolling"));

    expect(screen.getByTestId("rolling")).toHaveAttribute(
      "data-expanded",
      "true"
    );
  });

  it("hides winner announcements when perpetual ranking is selected", () => {
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={{ ...baseDates, ongoingRanking: true }}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.queryByTestId("decisions")).toBeNull();
    expect(screen.queryByTestId("rolling")).toBeNull();
    // The mode itself is chosen on the Overview step, not here.
    expect(screen.queryByText("Perpetual Ranking")).toBeNull();
  });

  it("keeps the perpetual end date cleared when other dates change", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={{ ...baseDates, ongoingRanking: true, endDate: 999 }}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByTestId("start"));

    expect(setDates).toHaveBeenCalledWith(
      expect.objectContaining({ ongoingRanking: true, endDate: null })
    );
  });

  it("expands winner announcements by default so the schedule is not missed", () => {
    render(
      <CreateWaveDatesRank
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("decisions")).toHaveAttribute(
      "data-expanded",
      "true"
    );
  });
});
