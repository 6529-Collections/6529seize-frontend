import { fireEvent, render, screen } from "@testing-library/react";
import CompetitionEntryDelete from "@/components/competitions/CompetitionEntryDelete";
import CompetitionVote from "@/components/competitions/CompetitionVote";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import { invalidateCompetition } from "@/services/api/competitions-api";

let mockEnabled = true;
let mockOwner = true;
let mockAdmin = false;
let mockAdminDelete = false;
let mockProxy = false;
const mockDeleteModal = jest.fn();
const entry = {
  id: "entry",
  drop_id: "drop",
  status: "ACTIVE",
  submitter: { id: "author" },
} as ApiCompetitionEntry;
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => mockEnabled,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: mockOwner ? "author" : "viewer", handle: "viewer" },
    activeProfileProxy: mockProxy ? { id: "proxy" } : null,
  }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    wave: {
      id: "wave",
      wave: { admin_drop_deletion_enabled: mockAdminDelete },
    },
    competition: {
      id: "competition",
      wave_id: "wave",
      permissions: { administer: mockAdmin },
    },
  }),
}));
jest.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({}) }));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "author",
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignature: () => jest.fn(),
}));
jest.mock("@/services/api/competitions-api", () => ({
  invalidateCompetition: jest.fn().mockResolvedValue(undefined),
}));
jest.mock(
  "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal",
  () => (props: { onDropDeleted: () => void }) => {
    mockDeleteModal(props);
    return <button onClick={props.onDropDeleted}>Confirm deletion</button>;
  }
);

beforeEach(() => {
  jest.clearAllMocks();
  mockEnabled = true;
  mockOwner = true;
  mockAdmin = false;
  mockAdminDelete = false;
  mockProxy = false;
});

it("uses the existing drop deletion dialog and refreshes the competition afterward", () => {
  render(<CompetitionEntryDelete entry={entry} />);
  expect(screen.queryByText(/withdraw|disqualify/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete", exact: true }));
  expect(mockDeleteModal).toHaveBeenCalledWith(
    expect.objectContaining({
      drop: { id: "drop", drop_type: "PARTICIPATORY", wave: { id: "wave" } },
    })
  );
  fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
  expect(invalidateCompetition).toHaveBeenCalledWith(
    {},
    { waveId: "wave", competitionId: "competition" }
  );
});

it.each([false, true])(
  "respects the existing administrator deletion setting (%s)",
  (enabled) => {
    mockOwner = false;
    mockAdmin = true;
    mockAdminDelete = enabled;
    render(<CompetitionEntryDelete entry={entry} />);
    expect(
      screen.queryByRole("button", { name: "Delete", exact: true }) !== null
    ).toBe(enabled);
  }
);

it("hides deletion for proxies", () => {
  mockProxy = true;
  const { container } = render(<CompetitionEntryDelete entry={entry} />);
  expect(container).toBeEmptyDOMElement();
});

it("omits native vote and deletion controls while the rollout flag is off", () => {
  mockEnabled = false;
  const { container } = render(
    <>
      <CompetitionVote entryId="entry" dropId="drop" disabled={false} />
      <CompetitionEntryDelete entry={entry} />
    </>
  );
  expect(container).toBeEmptyDOMElement();
});
