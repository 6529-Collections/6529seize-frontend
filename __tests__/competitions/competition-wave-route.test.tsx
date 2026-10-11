import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionWaveRoute from "@/components/competitions/CompetitionWaveRoute";

let mockDefaultId: string | null = "alpha";
let mockSelectionPending = false;
let mockSelectionError = false;
let mockPrimary: string | null = null;
let mockViewer = "member";
let mockSearch = "";
const mockRefetch = jest.fn();
const mockCompetition = {
  id: "alpha",
  wave_id: "wave",
  lifecycle: "PUBLISHED",
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: { id: "wave" }, refetch: mockRefetch }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => mockViewer,
  useCompetitionHub: () => ({
    data: { id: "wave", legacy_primary_competition_id: mockPrimary },
    refetch: mockRefetch,
  }),
  useCompetitionDetail: () => ({ data: mockCompetition, refetch: mockRefetch }),
  useDefaultCompetition: () => ({
    data: { competition_id: mockDefaultId },
    isPending: mockSelectionPending,
    isError: mockSelectionError,
    refetch: mockRefetch,
  }),
}));
jest.mock(
  "@/components/waves/layout/WavesLayout",
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);
jest.mock("@/components/brain/my-stream/MyStreamWave", () => {
  const { useCompetitionNavigation } = jest.requireActual(
    "@/contexts/CompetitionNavigationContext"
  );
  return ({ competitionContent }: { competitionContent?: React.ReactNode }) => {
    const { flat } = useCompetitionNavigation();
    return (
      <div data-testid="wave" data-flat={String(flat)}>
        {competitionContent ?? "Direct legacy content"}
      </div>
    );
  };
});
jest.mock("@/components/competitions/CompetitionDetail", () => ({
  __esModule: true,
  default: () => <section data-testid="detail">Nested detail</section>,
  NativeCompetitionContent: ({ embedded }: { embedded: boolean }) => (
    <div data-testid="native" data-embedded={String(embedded)}>
      <input aria-label="Entry text" />
    </div>
  ),
}));
jest.mock("@/components/competitions/CompetitionState", () => ({
  CompetitionState: () => <div role="status">Loading competition</div>,
}));

beforeEach(() => {
  mockDefaultId = "alpha";
  mockSelectionPending = false;
  mockSelectionError = false;
  mockPrimary = null;
  mockViewer = "member";
  mockSearch = "";
  mockCompetition.lifecycle = "PUBLISHED";
});

it("renders a native default directly in the wave, including explicit default deep links", () => {
  render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
  expect(screen.getByTestId("native")).toHaveAttribute("data-embedded", "true");
  expect(screen.queryByTestId("detail")).toBeNull();
});

it("uses the original legacy wave content without mounting another wave shell", () => {
  mockPrimary = "alpha";
  render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getAllByTestId("wave")).toHaveLength(1);
  expect(screen.getByText("Direct legacy content")).toBeVisible();
  expect(screen.queryByTestId("detail")).toBeNull();
});

it("renders every selected published competition in the main tab row", () => {
  mockDefaultId = "beta";
  render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
  expect(screen.getByTestId("native")).toBeVisible();
});

it("renders explicit competition links while default selection is pending", () => {
  mockSelectionPending = true;
  const { rerender } = render(
    <CompetitionWaveRoute waveId="wave" competitionId="alpha" />
  );
  expect(screen.getByTestId("native")).toBeVisible();
  mockSelectionPending = false;
  rerender(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
});

it("keeps explicit reads usable when default selection fails", () => {
  mockSelectionError = true;
  render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("native")).toBeVisible();
});

it("preserves a mounted entry form and layout when the default changes or the command pins its URL", () => {
  mockSearch = "default=1";
  const { rerender } = render(
    <CompetitionWaveRoute waveId="wave" competitionId="alpha" />
  );
  fireEvent.change(screen.getByLabelText("Entry text"), {
    target: { value: "Unfinished entry" },
  });
  mockSearch = "";
  mockDefaultId = "beta";
  rerender(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("wave")).toHaveAttribute("data-flat", "true");
  expect(screen.getByLabelText("Entry text")).toHaveValue("Unfinished entry");
});

it("reclassifies navigation for a different viewer without retaining the previous viewer's form", () => {
  const { rerender } = render(
    <CompetitionWaveRoute waveId="wave" competitionId="alpha" />
  );
  mockViewer = "other-member";
  mockDefaultId = "beta";
  rerender(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("native")).toBeVisible();
  expect(screen.getByLabelText("Entry text")).toHaveValue("");
});

it("keeps draft administration in the detail experience", () => {
  mockCompetition.lifecycle = "DRAFT";
  render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
  expect(screen.getByTestId("detail")).toBeVisible();
});

it.each(["rules", "votes", "voters"])(
  "renders the shared configuration/votes page for legacy %s",
  (tab) => {
    mockPrimary = "alpha";
    mockSearch = `tab=${tab}`;
    render(<CompetitionWaveRoute waveId="wave" competitionId="alpha" />);
    expect(screen.getByTestId("native")).toBeVisible();
    expect(screen.getAllByTestId("wave")).toHaveLength(1);
  }
);
