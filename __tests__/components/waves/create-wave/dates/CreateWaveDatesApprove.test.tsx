import { render, screen, waitFor } from "@testing-library/react";
import CreateWaveDatesApprove from "@/components/waves/create-wave/dates/CreateWaveDatesApprove";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApproveStart",
  () => {
    const MockCreateWaveDatesApproveStart = (props: any) => (
      <div data-expanded={String(props.isExpanded)} data-testid="start" />
    );
    MockCreateWaveDatesApproveStart.displayName =
      "MockCreateWaveDatesApproveStart";
    return MockCreateWaveDatesApproveStart;
  }
);

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApproveEnd",
  () => {
    const MockCreateWaveDatesApproveEnd = (props: any) => (
      <div data-expanded={String(props.isExpanded)} data-testid="end" />
    );
    MockCreateWaveDatesApproveEnd.displayName = "MockCreateWaveDatesApproveEnd";
    return MockCreateWaveDatesApproveEnd;
  }
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
  it("opens wave end when end date validation fails", async () => {
    const { rerender } = render(
      <CreateWaveDatesApprove
        dates={baseDates}
        errors={[CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED]}
        setDates={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("start")).toHaveAttribute(
        "data-expanded",
        "false"
      );
      expect(screen.getByTestId("end")).toHaveAttribute(
        "data-expanded",
        "true"
      );
    });

    rerender(
      <CreateWaveDatesApprove
        dates={{ ...baseDates, endDate: 20 }}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("end")).toHaveAttribute("data-expanded", "true");
  });
});
