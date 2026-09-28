import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CompetitionEntryModeration from "@/components/competitions/CompetitionEntryModeration";
import CompetitionVote from "@/components/competitions/CompetitionVote";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import {
  invalidateCompetition,
  performCompetitionEntryAction,
} from "@/services/api/competitions-api";

let mockEnabled = true;
let mockVersion = 1;
let mockKey = 0;
const entry = {
  id: "entry",
  status: "ACTIVE",
  submitter: { id: "author" },
} as ApiCompetitionEntry;
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => mockEnabled,
  newCompetitionRequestKey: () => `request-${++mockKey}`,
  isRejectedCompetitionCommand: (error: { status?: number }) =>
    error.status === 409,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "author" },
    requestAuth: async () => ({ success: true }),
  }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: {
      id: "competition",
      wave_id: "wave",
      config_version: mockVersion,
      lifecycle: "PUBLISHED",
      permissions: { administer: true },
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
  performCompetitionEntryAction: jest.fn(),
  invalidateCompetition: jest.fn().mockResolvedValue(undefined),
}));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    ({ onConfirm }: { onConfirm: () => void }) => (
      <button onClick={onConfirm}>Confirm</button>
    )
);

beforeEach(() => {
  jest.clearAllMocks();
  mockEnabled = true;
  mockVersion = 1;
});

it.each([true, false])(
  "retries moderation with a fresh command only after a known rejection (%s)",
  async (rejected) => {
    jest
      .mocked(performCompetitionEntryAction)
      .mockRejectedValueOnce(
        rejected ? { status: 409 } : new Error("Network disconnected")
      )
      .mockResolvedValueOnce(entry);
    const { rerender } = render(<CompetitionEntryModeration entry={entry} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await screen.findByRole("alert");
    const original = jest.mocked(performCompetitionEntryAction).mock
      .calls[0]![3];
    mockVersion = 2;
    rerender(<CompetitionEntryModeration entry={entry} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(performCompetitionEntryAction).toHaveBeenCalledTimes(2)
    );
    const retry = jest.mocked(performCompetitionEntryAction).mock.calls[1]![3];
    if (rejected) {
      expect(retry.idempotency_key).not.toBe(original.idempotency_key);
      expect(retry.config_version).toBe(2);
    } else {
      expect(retry).toEqual(original);
    }
    expect(invalidateCompetition).toHaveBeenCalled();
  }
);

it("omits native vote and moderation controls while the rollout flag is off", () => {
  mockEnabled = false;
  const { container } = render(
    <>
      <CompetitionVote entryId="entry" dropId="drop" disabled={false} />
      <CompetitionEntryModeration entry={entry} />
    </>
  );
  expect(container).toBeEmptyDOMElement();
});
