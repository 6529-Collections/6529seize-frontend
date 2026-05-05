import { render, screen } from "@testing-library/react";
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

  it("always renders wave start and wave end without drawer state", () => {
    const setDates = jest.fn();
    render(
      <CreateWaveDatesApprove
        dates={baseDates}
        errors={[CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED]}
        setDates={setDates}
      />
    );

    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
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
});
