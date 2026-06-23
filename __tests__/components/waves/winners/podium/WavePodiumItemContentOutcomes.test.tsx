import { render, screen } from "@testing-library/react";
import { WavePodiumItemContentOutcomes } from "@/components/waves/winners/podium/WavePodiumItemContentOutcomes";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}));

test("renders icons for all outcome types", () => {
  const winner = {
    place: 1,
    drop: { id: "test-drop-id" },
    awards: [
      { credit: ApiWaveOutcomeCredit.Cic, amount: 10 },
      { credit: ApiWaveOutcomeCredit.Rep, amount: 5, rep_category: "A" },
      { type: ApiWaveOutcomeType.Manual, description: "manual" },
    ],
  } as any;

  render(<WavePodiumItemContentOutcomes winner={winner} />);

  expect(screen.getByRole("button")).toHaveTextContent("Outcome");
  expect(screen.getByTestId("tooltip-outcome-1-test-drop-id")).toHaveTextContent(
    "NIC10Rep5Amanual"
  );
});

test("returns null when no outcomes", () => {
  const { container } = render(
    <WavePodiumItemContentOutcomes winner={{ awards: [] } as any} />
  );
  expect(container.firstChild).toBeNull();
});

test("returns null when outcomes are hidden", () => {
  const winner = {
    place: 1,
    drop: { id: "test-drop-id" },
    awards: [{ credit: ApiWaveOutcomeCredit.Cic, amount: 10 }],
  } as any;

  const { container } = render(
    <WavePodiumItemContentOutcomes winner={winner} outcomesVisible={false} />
  );

  expect(container.firstChild).toBeNull();
});
