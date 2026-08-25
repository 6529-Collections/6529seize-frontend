import { render, screen } from "@testing-library/react";
import WaveConfigurationApproval from "@/components/waves/groups/WaveConfigurationApproval";

jest.mock("@/components/waves/specs/WaveApprovalThresholds", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <>
      <div>Approve after</div>
      <div>Hold time</div>
      <span data-testid="approval-thresholds" data-display={display} />
    </>
  ),
}));

describe("WaveConfigurationApproval", () => {
  it("shows editable thresholds and the read-only creation-time values", () => {
    render(
      <WaveConfigurationApproval
        wave={{ id: "wave-id" } as any}
        section={{
          id: "approval",
          title: "Approval",
          rows: [
            {
              id: "approval-threshold",
              label: "Approval threshold",
              value: "3 approvals",
            },
            {
              id: "approval-hold",
              label: "Hold time",
              value: "1d",
            },
            {
              id: "approval-max",
              label: "Max approved drops",
              value: "5",
            },
            {
              id: "approval-window",
              label: "Approval window",
              value: "2026-08-24 to 2026-09-24",
            },
          ],
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Approval" })
    ).toBeInTheDocument();
    expect(screen.getByText("Approve after")).toBeInTheDocument();
    expect(screen.getByText("Hold time")).toBeInTheDocument();
    expect(screen.getByTestId("approval-thresholds")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByText("Max approved drops")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Approval window")).toBeInTheDocument();
    expect(screen.getByText("2026-08-24 to 2026-09-24")).toBeInTheDocument();
    expect(screen.queryByText("Approval threshold")).not.toBeInTheDocument();
  });
});
