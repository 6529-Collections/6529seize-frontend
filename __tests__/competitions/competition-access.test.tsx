import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompetitionAccess from "@/components/competitions/CompetitionAccess";
import CompetitionDetail from "@/components/competitions/CompetitionDetail";
import CompetitionDraftRoute from "@/components/competitions/CompetitionDraftRoute";
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
const mockPush = jest.fn();
const mockWave = {
  id: "wave",
  name: "Chat wave",
  wave: { type: "CHAT" },
};
const mockHub = {
  id: "wave",
  legacy_primary_competition_id: null,
  permissions: { create_competition: true },
};
type ReadState<T> = {
  data: T | undefined;
  isError: boolean;
  error: unknown;
  refetch: jest.Mock;
};
let mockWaveRead: ReadState<typeof mockWave>;
let mockHubRead: ReadState<typeof mockHub>;
let mockCompetitionRead: ReadState<typeof mockCompetition>;
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
  ...jest.requireActual("@/contexts/CompetitionContext"),
  useCompetition: () => ({
    competition: mockCompetition,
    hub: mockHub,
    wave: mockWave,
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
  ...jest.requireActual("@/helpers/competition.helpers"),
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
jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave/competitions/competition",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => mockWaveRead,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionHub: () => mockHubRead,
  useCompetitionDetail: () => mockCompetitionRead,
  useCompetitionPauseState: () => ({ isSuccess: false, isError: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: {} }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/competitions/CompetitionBackLink", () => () => null);
jest.mock("@/components/competitions/CompetitionResources", () => () => null);
jest.mock("@/components/competitions/CompetitionAdmin", () => () => null);
jest.mock("@/components/competitions/CompetitionEntryForm", () => () => null);
jest.mock("@/components/brain/my-stream/MyStreamWave", () => () => null);
jest.mock("@/components/competitions/CompetitionDraftEditor", () => ({
  __esModule: true,
  default: () => <input aria-label="Draft description" />,
}));
jest.mock(
  "@/components/waves/specs/groups/group/WaveGroupMembersScope",
  () => () => null
);
jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupChangeDialog",
  () =>
    function MockWaveGroupChangeDialog(props: {
      onGroupChange: (group: ApiGroupFull | null) => Promise<boolean>;
      onClose: () => void;
    }) {
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
  mockCompetition.lifecycle = "PUBLISHED";
  mockCompetition.config_version = 4;
  mockHub.permissions.create_competition = true;
  mockWaveRead = {
    data: mockWave,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
  mockHubRead = {
    data: mockHub,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
  mockCompetitionRead = {
    data: mockCompetition,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
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

function draftRoute(surface: "detail" | "new") {
  if (surface === "new") return <CompetitionDraftRoute waveId="wave" />;
  return <CompetitionDetail waveId="wave" competitionId="competition" />;
}

describe.each(["detail", "new"] as const)(
  "%s draft editor continuity",
  (surface) => {
    beforeEach(() => {
      mockCompetition.lifecycle = "DRAFT";
    });

    it.each([undefined, 429, 503])(
      "preserves an unfinished editor through a cached background failure (%s)",
      (status) => {
        const { rerender } = render(draftRoute(surface));
        const input = screen.getByLabelText("Draft description");
        fireEvent.change(input, { target: { value: "Unfinished draft" } });
        for (const result of [mockWaveRead, mockHubRead, mockCompetitionRead]) {
          result.isError = true;
          result.error =
            status === undefined ? new Error("Offline") : { status };
        }
        rerender(draftRoute(surface));
        expect(screen.getByLabelText("Draft description")).toBe(input);
        expect(input).toHaveValue("Unfinished draft");
        expect(screen.queryByRole("alert")).toBeNull();
      }
    );

    it.each([401, 403, 404])(
      "removes cached editor content when parent access is rejected (%s)",
      (status) => {
        const { rerender } = render(draftRoute(surface));
        fireEvent.change(screen.getByLabelText("Draft description"), {
          target: { value: "Unfinished draft" },
        });
        mockWaveRead.isError = true;
        mockWaveRead.error = { status };
        rerender(draftRoute(surface));
        expect(screen.queryByLabelText("Draft description")).toBeNull();
        expect(screen.getByRole("alert")).toBeVisible();
      }
    );

    it("shows the error state when the first parent read fails", () => {
      mockWaveRead.data = undefined;
      mockWaveRead.isError = true;
      mockWaveRead.error = { status: 503 };
      render(draftRoute(surface));
      expect(screen.queryByLabelText("Draft description")).toBeNull();
      expect(screen.getByRole("alert")).toBeVisible();
    });

    it.each([401, 403, 404])(
      "revokes cached editor content when its hub rejects access (%s)",
      (status) => {
        const { rerender } = render(draftRoute(surface));
        expect(screen.getByLabelText("Draft description")).toBeVisible();
        mockHubRead.isError = true;
        mockHubRead.error = { status };
        rerender(draftRoute(surface));
        expect(screen.queryByLabelText("Draft description")).toBeNull();
        expect(screen.getByRole("alert")).toBeVisible();
      }
    );
  }
);

it("removes a new draft editor when refreshed creation permission is revoked", () => {
  const { rerender } = render(draftRoute("new"));
  expect(screen.getByLabelText("Draft description")).toBeVisible();
  mockHub.permissions.create_competition = false;
  rerender(draftRoute("new"));
  expect(screen.queryByLabelText("Draft description")).toBeNull();
  expect(screen.getByRole("alert")).toBeVisible();
});

it.each([401, 403, 404])(
  "revokes a cached existing draft when its competition read rejects access (%s)",
  (status) => {
    mockCompetition.lifecycle = "DRAFT";
    const { rerender } = render(draftRoute("detail"));
    expect(screen.getByLabelText("Draft description")).toBeVisible();
    mockCompetitionRead.isError = true;
    mockCompetitionRead.error = { status };
    rerender(draftRoute("detail"));
    expect(screen.queryByLabelText("Draft description")).toBeNull();
    expect(screen.getByRole("alert")).toBeVisible();
  }
);
