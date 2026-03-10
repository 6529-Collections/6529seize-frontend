import { CollectedStatsSeasonTile } from "@/components/user/collected/stats/subcomponents/CollectedStatsSeasonTile";
import type { DisplaySeason } from "@/components/user/collected/stats/types";
import { render } from "@testing-library/react";

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
      isActive={false}
      showDetailText={false}
      hasTouchScreen={false}
      shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
      onActivate={jest.fn()}
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
});
