import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDatesApprove from "@/components/waves/create-wave/dates/CreateWaveDatesApprove";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

const mockStart = jest.fn((props: any) => (
  <div
    data-has-expanded-prop={String("isExpanded" in props)}
    data-testid="start"
  >
    start
  </div>
));
const mockEnd = jest.fn((props: any) => (
  <div data-has-expanded-prop={String("isExpanded" in props)} data-testid="end">
    end {props.errors.length}
  </div>
));

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApproveStart",
  () => (props: any) => mockStart(props)
);

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApproveEnd",
  () => (props: any) => mockEnd(props)
);

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: 10,
  votingStartDate: 10,
  endDate: null,
  firstDecisionTime: 0,
  subsequentDecisions: [],
  isRolling: false,
};

describe("CreateWaveDatesApprove", () => {
  beforeEach(() => {
    mockStart.mockClear();
    mockEnd.mockClear();
  });

  it("keeps wave start visible and the optional end date in advanced settings", () => {
    const setDates = jest.fn();
    render(
      <CreateWaveDatesApprove
        dates={baseDates}
        errors={[CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED]}
        setDates={setDates}
      />
    );

    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("start")).toBeVisible();
    expect(screen.getByTestId("end")).not.toBeVisible();
    const advancedButton = screen.getByRole("button", {
      name: "Wave end",
    });
    expect(advancedButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(advancedButton);

    expect(screen.getByTestId("end")).toBeVisible();
    expect(screen.getByTestId("start")).toHaveAttribute(
      "data-has-expanded-prop",
      "false"
    );
    expect(screen.getByTestId("end")).toHaveAttribute(
      "data-has-expanded-prop",
      "false"
    );
    expect(mockStart).toHaveBeenCalledWith({
      dates: baseDates,
      setDates,
    });
    expect(mockEnd).toHaveBeenCalledWith({
      dates: baseDates,
      errors: [CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED],
      setDates,
    });
  });

  it("opens the optional end date when it contains a validation error", () => {
    render(
      <CreateWaveDatesApprove
        dates={{ ...baseDates, endDate: 5 }}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Wave end Needs attention/,
      })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("end")).toBeVisible();
  });
});
