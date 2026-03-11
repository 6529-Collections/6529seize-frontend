import { CollectedStatsSeasonTile } from "@/components/user/collected/stats/subcomponents/CollectedStatsSeasonTile";
import type { DisplaySeason } from "@/components/user/collected/stats/types";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let shouldReduceMotion = false;

jest.mock("framer-motion", () => ({
  useReducedMotion: () => shouldReduceMotion,
}));

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const buildSeason = (
  overrides: Partial<DisplaySeason> = {}
): DisplaySeason => ({
  id: "Season 2",
  label: "SZN2",
  seasonNumber: 2,
  totalCards: 39,
  setsHeld: 1,
  nextSetCards: 26,
  totalCardsHeld: 1413,
  isStarted: true,
  isRestingComplete: false,
  progressPct: 26 / 39,
  detailText: "26/39 to set 2",
  ...overrides,
});

const renderTile = (
  season: DisplaySeason,
  shouldAnimateProgressOnMount = true
) =>
  render(
    <CollectedStatsSeasonTile
      season={season}
      isSelected={false}
      showDetailText={false}
      hasTouchScreen={false}
      shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
      onPreview={jest.fn()}
    />
  );

describe("CollectedStatsSeasonTile", () => {
  beforeEach(() => {
    shouldReduceMotion = false;
  });

  it("renders a declarative entry animation for partial progress arcs", () => {
    const season = buildSeason();
    const { container } = renderTile(season);

    const progressCircle = container.querySelectorAll("circle")[1];
    const progressAnimation = progressCircle?.querySelector("animate");

    expect(progressCircle).toHaveAttribute(
      "stroke-dashoffset",
      `${CIRCUMFERENCE - season.progressPct * CIRCUMFERENCE}`
    );
    expect(progressAnimation).toHaveAttribute("from", `${CIRCUMFERENCE}`);
    expect(progressAnimation).toHaveAttribute(
      "to",
      `${CIRCUMFERENCE - season.progressPct * CIRCUMFERENCE}`
    );
    expect(progressAnimation).toHaveAttribute("dur", "1.2s");
    expect(progressAnimation).toHaveAttribute("keySplines", "0.22 1 0.36 1");
  });

  it("renders the entry animation for full progress arcs", () => {
    const { container } = renderTile(
      buildSeason({
        setsHeld: 2,
        nextSetCards: 0,
        isRestingComplete: true,
        progressPct: 1,
        detailText: "Set 2 complete",
      })
    );

    const progressCircle = container.querySelectorAll("circle")[1];
    const progressAnimation = progressCircle?.querySelector("animate");

    expect(progressCircle).toHaveAttribute("stroke-dashoffset", "0");
    expect(progressAnimation).toHaveAttribute("to", "0");
  });

  it("does not render a progress arc when there is no visible progress", () => {
    const { container } = renderTile(
      buildSeason({
        setsHeld: 0,
        nextSetCards: 0,
        totalCardsHeld: 0,
        isStarted: false,
        isRestingComplete: false,
        progressPct: 0,
        detailText: null,
      })
    );

    expect(container.querySelectorAll("circle")).toHaveLength(1);
    expect(container.querySelector("animate")).not.toBeInTheDocument();
  });

  it("skips the entry animation when reduced motion is enabled", () => {
    shouldReduceMotion = true;

    const season = buildSeason();
    const { container } = renderTile(season);

    const progressCircle = container.querySelectorAll("circle")[1];

    expect(progressCircle).toHaveAttribute(
      "stroke-dashoffset",
      `${CIRCUMFERENCE - season.progressPct * CIRCUMFERENCE}`
    );
    expect(progressCircle?.querySelector("animate")).not.toBeInTheDocument();
  });

  it("does not trigger the selection handler on hover", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn();
    const onSelect = jest.fn();

    render(
      <CollectedStatsSeasonTile
        season={buildSeason()}
        isSelected={false}
        showDetailText={false}
        hasTouchScreen={false}
        shouldAnimateProgressOnMount
        onPreview={onPreview}
        onSelect={onSelect}
      />
    );

    const button = screen.getByRole("button", { name: /szn2/i });

    await user.hover(button);

    expect(onPreview).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a subtle selected state on the whole tile", () => {
    render(
      <CollectedStatsSeasonTile
        season={buildSeason()}
        isSelected
        showDetailText={false}
        hasTouchScreen={false}
        shouldAnimateProgressOnMount
        onPreview={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /szn2/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /szn2/i })).toHaveClass(
      "tw-border-iron-700",
      "tw-bg-iron-950/80"
    );
  });

  it("does not trigger preview when selection is activated by click", () => {
    const onPreview = jest.fn();
    const onSelect = jest.fn();

    render(
      <CollectedStatsSeasonTile
        season={buildSeason()}
        isSelected={false}
        showDetailText={false}
        hasTouchScreen
        shouldAnimateProgressOnMount
        onPreview={onPreview}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /szn2/i }));

    expect(onPreview).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
  });
});
