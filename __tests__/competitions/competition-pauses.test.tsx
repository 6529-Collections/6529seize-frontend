import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompetitionAdmin from "@/components/competitions/CompetitionAdmin";
import {
  performCompetitionAction,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import type { ReactNode } from "react";

const mockCompetition = {
  id: "competition",
  wave_id: "wave",
  title: "Test competition",
  lifecycle: "PUBLISHED",
  config_version: 4,
  permissions: { administer: true },
};
const mockQuery = {
  data: {
    pages: [
      {
        data: [
          {
            id: "current",
            start_time: 1000,
            end_time: null,
            reason: "Reviewing eligibility",
          },
          { id: "old", start_time: 10, end_time: 20, reason: null },
        ],
      },
    ],
  },
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: mockCompetition,
    hub: { legacy_primary_competition_id: null },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: async () => ({ success: true }) }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: () => mockQuery,
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
  newCompetitionRequestKey: () => "request-key",
  getCompetitionRoute: jest.fn(),
}));
jest.mock("@/services/api/competitions-api", () => ({
  performCompetitionAction: jest.fn(),
  invalidateCompetition: jest.fn(),
}));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    (props: {
      children: ReactNode;
      title: string;
      confirmDisabled: boolean;
      isConfirming: boolean;
      onConfirm: () => void;
      onClose: () => void;
    }) => (
      <div role="dialog" aria-label={props.title}>
        {props.children}
        <button
          disabled={props.confirmDisabled || props.isConfirming}
          onClick={props.onConfirm}
        >
          Confirm
        </button>
        <button onClick={props.onClose}>Go back</button>
      </div>
    )
);
function setup(paused = false) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <CompetitionAdmin paused={paused} onEdit={jest.fn()} />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockCompetition.permissions.administer = true;
  mockCompetition.config_version = 4;
  mockQuery.hasNextPage = false;
  jest
    .mocked(performCompetitionAction)
    .mockResolvedValue(mockCompetition as never);
  jest.mocked(invalidateCompetition).mockResolvedValue(undefined);
});
it("puts Pause outside Manage competition and requires a non-blank reason in its modal", async () => {
  setup();
  const pause = screen.getByRole("button", { name: "Pause decisions" });
  expect(pause.closest("details")).toBeNull();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(pause);
  const reason = screen.getByRole("textbox", { name: "Reason (required)" });
  expect(reason).toBeRequired();
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  fireEvent.change(reason, { target: { value: " \n " } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(performCompetitionAction).not.toHaveBeenCalled();
  fireEvent.change(reason, { target: { value: "  Checking eligibility  " } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(performCompetitionAction).toHaveBeenCalledWith(
      { waveId: "wave", competitionId: "competition" },
      "pause",
      {
        idempotency_key: "request-key",
        config_version: 4,
        reason: "Checking eligibility",
      }
    )
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  expect(invalidateCompetition).toHaveBeenCalled();
});
it("shows active and past pause reasons to non-administrators", () => {
  mockCompetition.permissions.administer = false;
  setup();
  expect(screen.getByText("Reviewing eligibility")).toBeInTheDocument();
  expect(screen.getByText("No reason recorded.")).toBeInTheDocument();
  expect(screen.getByText("Paused")).toBeInTheDocument();
  expect(screen.getByText("Resumed")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Pause decisions" })
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Manage competition")).not.toBeInTheDocument();
});
it("resumes without requiring a new reason", async () => {
  setup(true);
  fireEvent.click(screen.getByRole("button", { name: "Resume decisions" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(performCompetitionAction).toHaveBeenCalledWith(
      expect.anything(),
      "resume",
      expect.objectContaining({ reason: "" })
    )
  );
});
it("retains the reason and original request for a retry even if refreshed competition version changes", async () => {
  jest
    .mocked(performCompetitionAction)
    .mockRejectedValueOnce(new Error("Connection lost"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Pause decisions" }));
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Reviewing" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("textbox")).toHaveValue("Reviewing");
  mockCompetition.config_version = 5;
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(performCompetitionAction).toHaveBeenCalledTimes(2)
  );
  expect(jest.mocked(performCompetitionAction).mock.calls[1]).toEqual(
    jest.mocked(performCompetitionAction).mock.calls[0]
  );
});
it("loads older pauses without losing the visible history", () => {
  mockQuery.hasNextPage = true;
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Load more" }));
  expect(mockQuery.fetchNextPage).toHaveBeenCalled();
  expect(screen.getByText("Reviewing eligibility")).toBeInTheDocument();
});
