import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompetitionAccess from "@/components/competitions/CompetitionAccess";
import { commonApiFetch } from "@/services/api/common-api";
import {
  invalidateCompetition,
  updateCompetition,
} from "@/services/api/competitions-api";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

const mockCompetition = {
  id: "competition",
  wave_id: "wave",
  title: "Test competition",
  type: "RANK",
  lifecycle: "PUBLISHED",
  config_version: 4,
  permissions: { administer: true },
  participation: { group_id: null },
  voting: { group_id: null },
};
const mockToast = jest.fn();
const mockDialog = jest.fn();
const config = {
  title: "Test competition",
  participation: { scope: { group_id: null }, signature_required: true },
  voting: {
    scope: { group_id: null },
    credit_type: "TDH",
    signature_required: false,
  },
  rules: { type: "RANK", time_lock_ms: 60000 },
  outcomes: [{ description: "Winner" }],
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: mockCompetition,
    hub: { legacy_primary_competition_id: null },
    wave: { id: "wave", name: "Chat wave", wave: { type: "CHAT" } },
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestAuth: async () => ({ success: true }),
    setToast: mockToast,
    connectedProfile: null,
  }),
}));
jest.mock("@/hooks/groups/useGroupMutations", () => ({
  useGroupMutations: () => ({ isSubmitting: false, submit: jest.fn() }),
}));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => true,
  newCompetitionRequestKey: () => "request-key",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: { status?: number }) => error?.status,
}));
jest.mock("@/services/api/competitions-api", () => ({
  competitionEndpoint: () => "v3/waves/wave/competitions/competition",
  updateCompetition: jest.fn(),
  invalidateCompetition: jest.fn(),
}));
jest.mock(
  "@/components/waves/specs/groups/group/WaveGroupMembersScope",
  () => () => null
);
jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupChangeDialog",
  () =>
    (props: {
      onGroupChange: (group: ApiGroupFull | null) => Promise<boolean>;
      onClose: () => void;
    }) => {
      mockDialog(props);
      return (
        <div role="dialog">
          <button
            onClick={() =>
              void props.onGroupChange({ id: "selected-group" } as ApiGroupFull)
            }
          >
            Apply access
          </button>
          <button onClick={props.onClose}>Close</button>
        </div>
      );
    }
);

function renderAccess(type: "participation" | "voting") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CompetitionAccess type={type} />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockCompetition.permissions.administer = true;
  mockCompetition.type = "RANK";
  mockCompetition.config_version = 4;
  jest.mocked(commonApiFetch).mockResolvedValue(config);
  jest.mocked(updateCompetition).mockResolvedValue(mockCompetition as never);
  jest.mocked(invalidateCompetition).mockResolvedValue(undefined);
});

it.each(["participation", "voting"] as const)(
  "edits only %s access using the existing editor and competition endpoint",
  async (type) => {
    renderAccess(type);
    fireEvent.click(screen.getByRole("button", { name: /edit.*access/i }));
    expect(mockDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: type === "participation" ? "DROP" : "VOTE",
        wave: expect.objectContaining({
          name: "Test competition",
          wave: { type: "RANK" },
        }),
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply access" }));
    await waitFor(() =>
      expect(updateCompetition).toHaveBeenCalledWith(
        { waveId: "wave", competitionId: "competition" },
        {
          config_version: 4,
          idempotency_key: "request-key",
          config: {
            ...config,
            [type]: { ...config[type], scope: { group_id: "selected-group" } },
          },
        }
      )
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(invalidateCompetition).toHaveBeenCalled();
  }
);

it("uses the Approve access editor for Approve competitions", () => {
  mockCompetition.type = "APPROVE";
  renderAccess("participation");
  fireEvent.click(screen.getByRole("button", { name: /edit.*access/i }));
  expect(mockDialog).toHaveBeenCalledWith(
    expect.objectContaining({
      wave: expect.objectContaining({ wave: { type: "APPROVE" } }),
    })
  );
});

it("does not show editing controls to members", () => {
  mockCompetition.permissions.administer = false;
  renderAccess("participation");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("preserves the editor and reuses the same request when retrying an uncertain save", async () => {
  jest
    .mocked(updateCompetition)
    .mockRejectedValueOnce(new Error("Network interrupted"));
  renderAccess("voting");
  fireEvent.click(screen.getByRole("button", { name: /edit.*access/i }));
  fireEvent.click(screen.getByRole("button", { name: "Apply access" }));
  await waitFor(() => expect(mockToast).toHaveBeenCalled());
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Apply access" }));
  await waitFor(() => expect(updateCompetition).toHaveBeenCalledTimes(2));
  expect(jest.mocked(updateCompetition).mock.calls[0]).toEqual(
    jest.mocked(updateCompetition).mock.calls[1]
  );
});
