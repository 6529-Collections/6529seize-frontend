import { render, screen } from "@testing-library/react";
import { WavePodiumItemContentOutcomes } from "@/components/waves/winners/podium/WavePodiumItemContentOutcomes";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";

let mockIsTouchDevice = false;

jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => mockIsTouchDevice,
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, closeEvents, id, openEvents }: any) => (
    <div
      data-testid={`tooltip-${id}`}
      data-open-events={JSON.stringify(openEvents)}
      data-close-events={JSON.stringify(closeEvents)}
    >
      {children}
    </div>
  ),
}));

beforeEach(() => {
  mockIsTouchDevice = false;
});

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

  const outcomeButton = screen.getByRole("button");
  expect(outcomeButton).toHaveTextContent("Outcome");
  expect(outcomeButton).toHaveAttribute(
    "aria-describedby",
    "outcome-1-test-drop-id-description"
  );
  expect(screen.getByText("NIC 10, Rep 5 · A, and manual")).toHaveClass(
    "tw-sr-only"
  );
  expect(
    screen.getByTestId("tooltip-outcome-1-test-drop-id")
  ).toHaveTextContent("NIC10Rep5Amanual");
});

test("uses tap-only events on touch-first devices", () => {
  mockIsTouchDevice = true;
  const winner = {
    place: 1,
    drop: { id: "test-drop-id" },
    awards: [{ credit: ApiWaveOutcomeCredit.Cic, amount: 10 }],
  } as any;

  render(<WavePodiumItemContentOutcomes winner={winner} />);

  const tooltip = screen.getByTestId("tooltip-outcome-1-test-drop-id");
  expect(tooltip).toHaveAttribute("data-open-events", '{"click":true}');
  expect(tooltip).toHaveAttribute("data-close-events", '{"click":true}');
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
