import { render, screen } from "@testing-library/react";
import { WaveWinnersTimeline } from "@/components/waves/winners/WaveWinnersTimeline";

jest.mock("@/components/waves/winners/WaveWinnersTimelineLoading", () => ({
  WaveWinnersTimelineLoading: () => <div data-testid="loading" />,
}));
jest.mock("@/components/waves/winners/WaveWinnersEmpty", () => ({
  WaveWinnersEmpty: () => <div data-testid="empty" />,
}));
const dropsOrder: string[] = [];
const dropsProps: any[] = [];
jest.mock("@/components/waves/winners/drops/WaveWinnersDrops", () => ({
  WaveWinnersDrops: (props: any) => {
    dropsOrder.push(props.winners[0].drop.id);
    dropsProps.push(props);
    return <div data-testid={`drops-${props.winners[0].drop.id}`} />;
  },
}));

const wave = { id: "w" } as any;
const makePoint = (id: string, date: string) => ({
  decision_time: date,
  winners: [{ drop: { id } }],
});

beforeEach(() => {
  dropsOrder.length = 0;
  dropsProps.length = 0;
});

it("shows loading and empty states", () => {
  const { rerender } = render(
    <WaveWinnersTimeline
      decisionPoints={[]}
      wave={wave}
      onDropClick={jest.fn()}
      isLoading={true}
    />
  );
  expect(screen.getByTestId("loading")).toBeInTheDocument();
  rerender(
    <WaveWinnersTimeline
      decisionPoints={[]}
      wave={wave}
      onDropClick={jest.fn()}
      isLoading={false}
    />
  );
  expect(screen.getByTestId("empty")).toBeInTheDocument();
});

it("sorts decision points and renders drops", () => {
  const points = [
    makePoint("1", "2024-01-01T00:00:00Z"),
    makePoint("2", "2024-01-02T00:00:00Z"),
  ] as any;
  render(
    <WaveWinnersTimeline
      decisionPoints={points}
      wave={wave}
      onDropClick={jest.fn()}
      isLoading={false}
    />
  );
  expect(dropsOrder).toEqual(["2", "1"]);
  const decisionTime = new Date(points[0].decision_time);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(decisionTime);
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(decisionTime);
  expect(screen.getByText(formattedDate)).toBeInTheDocument();
  // Both decisions share a time of day, so the time appears once per entry.
  expect(screen.getAllByText(formattedTime)).toHaveLength(2);
});

it("shows each decision in the requested pattern for the viewer zone", () => {
  // Built from local parts so the expected text holds in any host zone.
  const decisionTime = new Date(2026, 9, 12, 16, 5).getTime();
  const points = [
    { decision_time: decisionTime, winners: [{ drop: { id: "1" } }] },
  ] as any;
  render(
    <WaveWinnersTimeline
      decisionPoints={points}
      wave={wave}
      onDropClick={jest.fn()}
      isLoading={false}
    />
  );
  expect(screen.getByText("Mon, Oct 12, 2026")).toBeInTheDocument();
  // ICU separates the time and the day period with a (narrow) no-break space.
  expect(screen.getByText(/^4:05\sPM$/)).toBeInTheDocument();
});

it("passes content presentation to rendered drops", () => {
  const points = [
    makePoint("1", "2024-01-01T00:00:00Z"),
    makePoint("2", "2024-01-02T00:00:00Z"),
  ] as any;

  render(
    <WaveWinnersTimeline
      decisionPoints={points}
      wave={wave}
      onDropClick={jest.fn()}
      isLoading={false}
      contentPresentation="quorumCompact"
    />
  );

  expect(dropsProps.map((props) => props.contentPresentation)).toEqual([
    "quorumCompact",
    "quorumCompact",
  ]);
});
