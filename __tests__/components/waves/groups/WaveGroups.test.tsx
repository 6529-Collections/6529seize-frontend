import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveGroups from "@/components/waves/groups/WaveGroups";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

// Capture props passed to the mocked WaveGroup component
const captured: any[] = [];
const capturedActiveCuration: any[] = [];
jest.mock("@/components/waves/specs/groups/group/WaveGroup", () => {
  const { WaveGroupType } = jest.requireActual(
    "../../../../components/waves/specs/groups/group/WaveGroup.types"
  );
  return {
    __esModule: true,
    default: (props: any) => {
      captured.push(props);
      return <div data-testid={`group-${props.type}`} />;
    },
    WaveGroupType,
  };
});

jest.mock(
  "@/components/waves/groups/curation/WaveActiveCurationSection",
  () => ({
    __esModule: true,
    default: (props: any) => {
      capturedActiveCuration.push(props);
      return <div data-testid="curation-section">Curation</div>;
    },
  })
);
jest.mock("@/components/waves/specs/WaveApprovalThresholds", () => ({
  __esModule: true,
  default: () => <div data-testid="approval-thresholds" />,
}));
jest.mock("@/components/waves/specs/WaveApproveTabLabels", () => ({
  __esModule: true,
  default: () => <div data-testid="approve-tab-labels" />,
}));

const commonApiPostMock = commonApiPost as jest.Mock;

const makeWave = (
  overrides: {
    readonly canAdmin?: boolean | undefined;
    readonly chatEnabled?: boolean | undefined;
    readonly linksDisabled?: boolean | undefined;
    readonly slowModeCooldownMs?: number | undefined;
    readonly waveType?: ApiWaveType | undefined;
  } = {}
): any => ({
  id: "wave-1",
  name: "Wave",
  picture: null,
  author: { handle: "creator" },
  wave: {
    type: overrides.waveType ?? ApiWaveType.Rank,
    admin_group: { group: null },
    authenticated_user_eligible_for_admin: overrides.canAdmin ?? false,
    admin_drop_deletion_enabled: false,
    winning_threshold: null,
    winning_threshold_min_duration_ms: null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    decisions_strategy: null,
  },
  visibility: { scope: { group: null } },
  participation: {
    scope: { group: null },
    authenticated_user_eligible: true,
    no_of_applications_allowed_per_participant: null,
    required_media: null,
    required_metadata: [],
    signature_required: false,
    period: null,
    terms: null,
  },
  voting: {
    scope: { group: null },
    authenticated_user_eligible: false,
    credit_type: "REP",
    credit_category: null,
    creditor: null,
    credit_scope: "WAVE",
    signature_required: false,
    period: null,
    forbid_negative_votes: false,
  },
  chat: {
    scope: { group: null },
    authenticated_user_eligible: true,
    enabled: overrides.chatEnabled ?? true,
    links_disabled: overrides.linksDisabled ?? false,
    slow_mode_cooldown_ms: overrides.slowModeCooldownMs,
  },
  metrics: { your_participation_drops_count: 0 },
});

const renderWaveGroups = ({
  wave = makeWave(),
  connectedHandle = "viewer",
  useRing,
}: {
  readonly wave?: any;
  readonly connectedHandle?: string | null;
  readonly useRing?: boolean | undefined;
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Providers = ({ children }: { readonly children: React.ReactNode }) => (
    <AuthContext.Provider
      value={
        {
          connectedProfile:
            connectedHandle === null ? null : { handle: connectedHandle },
          activeProfileProxy: null,
          requestAuth: jest.fn(async () => ({ success: true })),
          setToast: jest.fn(),
        } as any
      }
    >
      <QueryClientProvider client={queryClient}>
        <ReactQueryWrapperContext.Provider
          value={{ onWaveCreated: jest.fn() } as any}
        >
          {children}
        </ReactQueryWrapperContext.Provider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );

  return render(<WaveGroups wave={wave} useRing={useRing} />, {
    wrapper: Providers,
  });
};

describe("WaveGroups", () => {
  beforeEach(() => {
    commonApiPostMock.mockResolvedValue(makeWave());
    captured.length = 0;
    capturedActiveCuration.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders all groups with ring by default", () => {
    const baseWave = makeWave({ waveType: ApiWaveType.Rank });
    const { getAllByTestId, getByTestId, container } = renderWaveGroups({
      wave: baseWave,
    });
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.queryByText("General")).not.toBeInTheDocument();
    expect(screen.getByText("Curation")).toBeInTheDocument();
    expect(getAllByTestId(/group-/)).toHaveLength(5);
    expect(getByTestId("curation-section")).toBeInTheDocument();
    expect(capturedActiveCuration).toHaveLength(1);
    expect(capturedActiveCuration[0].wave).toBe(baseWave);
    expect(captured.map((c) => c.type)).toEqual([
      "VIEW",
      "DROP",
      "VOTE",
      "CHAT",
      "ADMIN",
    ]);
    const inner = container.querySelector(".tw-h-full") as HTMLElement;
    expect(inner.className).toContain("tw-ring-1");
  });

  it("omits drop and vote groups for chat waves and no ring", () => {
    const wave = makeWave({ waveType: ApiWaveType.Chat });
    const { getAllByTestId, getByTestId, container } = renderWaveGroups({
      wave,
      useRing: false,
    });
    expect(getAllByTestId(/group-/)).toHaveLength(3);
    expect(getByTestId("curation-section")).toBeInTheDocument();
    expect(capturedActiveCuration).toHaveLength(1);
    expect(capturedActiveCuration[0].wave).toBe(wave);
    expect(captured.map((c) => c.type)).toEqual(["VIEW", "CHAT", "ADMIN"]);
    const inner = container.querySelector(".tw-h-full") as HTMLElement;
    expect(inner.className).toContain("tw-rounded-b-xl");
  });

  it("shows slow mode off", () => {
    renderWaveGroups({ wave: makeWave() });

    expect(screen.getByText("Slow mode")).toBeInTheDocument();
    expect(screen.getAllByText("Off").length).toBeGreaterThan(0);
  });

  it("shows slow mode on with interval", () => {
    renderWaveGroups({ wave: makeWave({ slowModeCooldownMs: 300_000 }) });

    expect(screen.getByText("On · 5m")).toBeInTheDocument();
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "shows slow mode for %s waves when chat is enabled",
    (waveType) => {
      renderWaveGroups({ wave: makeWave({ waveType }) });

      expect(screen.getByText("Slow mode")).toBeInTheDocument();
    }
  );

  it("hides chat settings when chat is disabled", () => {
    renderWaveGroups({ wave: makeWave({ chatEnabled: false }) });

    expect(screen.queryByText("Slow mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Disable links")).not.toBeInTheDocument();
  });

  it("shows edit icon only when user can edit wave", () => {
    const { rerender } = renderWaveGroups({
      wave: makeWave({ canAdmin: true }),
    });

    expect(
      screen.getByRole("button", { name: "Edit slow mode" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit disable links" })
    ).toBeInTheDocument();

    rerender(<WaveGroups wave={makeWave({ canAdmin: false })} />);

    expect(
      screen.queryByRole("button", { name: "Edit slow mode" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit disable links" })
    ).not.toBeInTheDocument();
  });

  it("opens slow mode editor in a portal outside the groups scroll container", async () => {
    const user = userEvent.setup();
    const { container } = renderWaveGroups({
      wave: makeWave({ canAdmin: true }),
    });

    const editButton = screen.getByRole("button", {
      name: "Edit slow mode",
    });
    expect(editButton).toHaveAttribute("aria-expanded", "false");

    await user.click(editButton);

    const editorId = editButton.getAttribute("aria-controls");
    expect(editorId).toBeTruthy();
    const editor = globalThis.document.getElementById(editorId as string);
    const scrollContainer = container.firstElementChild;

    expect(editButton).toHaveAttribute("aria-expanded", "true");
    expect(editor).toBeInTheDocument();
    expect(globalThis.document.body).toContainElement(editor);
    expect(scrollContainer).not.toContainElement(editor);
    expect(screen.getByLabelText("Slow mode value")).toHaveFocus();
  });

  it("closes slow mode editor on Escape", async () => {
    const user = userEvent.setup();
    renderWaveGroups({ wave: makeWave({ canAdmin: true }) });

    await user.click(screen.getByRole("button", { name: "Edit slow mode" }));
    expect(screen.getByLabelText("Slow mode value")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByLabelText("Slow mode value")).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Edit slow mode" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("closes slow mode editor on outside click", async () => {
    const user = userEvent.setup();
    renderWaveGroups({ wave: makeWave({ canAdmin: true }) });

    await user.click(screen.getByRole("button", { name: "Edit slow mode" }));
    expect(screen.getByLabelText("Slow mode value")).toBeInTheDocument();

    await user.click(screen.getByText("Access"));

    await waitFor(() =>
      expect(screen.queryByLabelText("Slow mode value")).not.toBeInTheDocument()
    );
  });

  it("saves slow mode as milliseconds", async () => {
    const user = userEvent.setup();
    renderWaveGroups({ wave: makeWave({ canAdmin: true }) });

    await user.click(screen.getByRole("button", { name: "Edit slow mode" }));
    await user.clear(screen.getByLabelText("Slow mode value"));
    await user.type(screen.getByLabelText("Slow mode value"), "5");
    await user.selectOptions(
      screen.getByLabelText("Slow mode unit"),
      "minutes"
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.chat).toMatchObject({
      links_disabled: false,
      slow_mode_cooldown_ms: 300_000,
    });
  });

  it("disables slow mode by omitting it from chat body", async () => {
    const user = userEvent.setup();
    renderWaveGroups({
      wave: makeWave({ canAdmin: true, slowModeCooldownMs: 60_000 }),
    });

    await user.click(screen.getByRole("button", { name: "Edit slow mode" }));
    await user.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.chat).not.toHaveProperty(
      "slow_mode_cooldown_ms"
    );
    expect(commonApiPostMock.mock.calls[0][0].body.chat).toMatchObject({
      links_disabled: false,
    });
  });

  it("shows disable links state", () => {
    renderWaveGroups({ wave: makeWave({ linksDisabled: true }) });

    expect(screen.getByText("Disable links")).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("saves disable links setting", async () => {
    const user = userEvent.setup();
    renderWaveGroups({ wave: makeWave({ canAdmin: true }) });

    await user.click(
      screen.getByRole("button", { name: "Edit disable links" })
    );
    await user.click(screen.getByLabelText("Disable links"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(commonApiPostMock.mock.calls[0][0].body.chat).toMatchObject({
      links_disabled: true,
    });
  });
});
