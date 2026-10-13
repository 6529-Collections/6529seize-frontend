import { render, screen } from "@testing-library/react";
import CompetitionHub from "@/components/competitions/CompetitionHub";

let mockEnabled = true;
let mockCanCreate = true;

jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: () => mockEnabled,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionHub: () => ({
    data: {
      id: "wave",
      name: "Wave",
      permissions: { administer: false, create_competition: mockCanCreate },
    },
  }),
  useCompetitionList: () => ({ data: { pages: [{ data: [] }] } }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));

it.each([
  [true, true, true],
  [true, false, false],
  [false, true, false],
  [false, false, false],
])(
  "preserves competition creation permission and rollout gating (%s, %s)",
  (enabled, canCreate, visible) => {
    mockEnabled = enabled;
    mockCanCreate = canCreate;
    render(<CompetitionHub waveId="wave" embedded />);
    const action = screen.queryByRole("link", {
      name: "Competition",
    });
    if (visible) {
      expect(action).toHaveAttribute("href", "/waves/wave/competitions/new");
      expect(screen.queryByRole("tab", { name: "Drafts" })).toBeNull();
    } else {
      expect(action).toBeNull();
    }
  }
);
