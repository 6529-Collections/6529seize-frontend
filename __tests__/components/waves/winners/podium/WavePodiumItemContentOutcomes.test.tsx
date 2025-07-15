import { render, screen } from "@testing-library/react";
import { WavePodiumItemContentOutcomes } from "../../../../../components/waves/winners/podium/WavePodiumItemContentOutcomes";
import { ApiWaveOutcomeCredit } from "../../../../../generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "../../../../../generated/models/ApiWaveOutcomeType";

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>
      {children}
    </div>
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

  // Three icons inside the button container
  const button = screen.getByRole("button");
  expect(button.querySelectorAll("svg").length).toBeGreaterThanOrEqual(3);
});

test("returns null when no outcomes", () => {
  const { container } = render(<WavePodiumItemContentOutcomes winner={{ awards: [] } as any} />);
  expect(container.firstChild).toBeNull();
});
