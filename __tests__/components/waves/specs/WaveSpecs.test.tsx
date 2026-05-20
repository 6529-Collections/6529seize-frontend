import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveSpecs from "@/components/waves/specs/WaveSpecs";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { commonApiPost } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("@/components/waves/specs/WaveTypeIcon", () => () => (
  <div data-testid="wave-type-icon" />
));
jest.mock("@/components/waves/specs/WaveRating", () => () => (
  <div data-testid="wave-rating" />
));
jest.mock("@/components/waves/specs/WaveAuthor", () => () => (
  <div data-testid="wave-author" />
));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const commonApiPostMock = commonApiPost as jest.Mock;

const makeWave = (
  overrides: {
    readonly slowModeCooldownMs?: number | undefined;
    readonly canAdmin?: boolean | undefined;
    readonly chatEnabled?: boolean | undefined;
    readonly linksDisabled?: boolean | undefined;
    readonly waveType?: ApiWaveType | undefined;
  } = {}
): any => ({
  id: "wave-1",
  name: "Wave",
  picture: null,
  author: { handle: "creator" },
  voting: {
    scope: { group: null },
    credit_type: "REP",
    credit_category: null,
    creditor: null,
    signature_required: false,
    period: null,
    forbid_negative_votes: false,
  },
  visibility: { scope: { group: null } },
  chat: {
    scope: { group: null },
    enabled: overrides.chatEnabled ?? true,
    authenticated_user_eligible: true,
    links_disabled: overrides.linksDisabled ?? false,
    slow_mode_cooldown_ms: overrides.slowModeCooldownMs,
  },
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
  wave: {
    admin_drop_deletion_enabled: false,
    type: overrides.waveType ?? ApiWaveType.Chat,
    winning_threshold: null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    admin_group: { group: null },
    decisions_strategy: null,
    authenticated_user_eligible_for_admin: overrides.canAdmin ?? false,
  },
  metrics: { your_participation_drops_count: 0 },
});

const renderWaveSpecs = ({
  wave = makeWave(),
  connectedHandle = "viewer",
}: {
  readonly wave?: any;
  readonly connectedHandle?: string | null;
} = {}) => {
  return render(
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
      <ReactQueryWrapperContext.Provider
        value={{ onWaveCreated: jest.fn() } as any}
      >
        <WaveSpecs wave={wave} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
};

describe("WaveSpecs", () => {
  beforeEach(() => {
    commonApiPostMock.mockResolvedValue(makeWave());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows slow mode off", () => {
    renderWaveSpecs({ wave: makeWave() });

    expect(screen.getByText("Slow mode")).toBeInTheDocument();
    expect(screen.getAllByText("Off").length).toBeGreaterThan(0);
  });

  it("shows slow mode on with interval", () => {
    renderWaveSpecs({ wave: makeWave({ slowModeCooldownMs: 300_000 }) });

    expect(screen.getByText("On · 5m")).toBeInTheDocument();
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "shows slow mode for %s waves when chat is enabled",
    (waveType) => {
      renderWaveSpecs({ wave: makeWave({ waveType }) });

      expect(screen.getByText("Slow mode")).toBeInTheDocument();
    }
  );

  it("hides slow mode when chat is disabled", () => {
    renderWaveSpecs({ wave: makeWave({ chatEnabled: false }) });

    expect(screen.queryByText("Slow mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Disable links")).not.toBeInTheDocument();
  });

  it("shows edit icon only when user can edit wave", () => {
    const { rerender } = renderWaveSpecs({
      wave: makeWave({ canAdmin: true }),
    });

    expect(
      screen.getByRole("button", { name: "Edit slow mode" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit disable links" })
    ).toBeInTheDocument();

    rerender(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "viewer" },
            activeProfileProxy: null,
            requestAuth: jest.fn(async () => ({ success: true })),
            setToast: jest.fn(),
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider
          value={{ onWaveCreated: jest.fn() } as any}
        >
          <WaveSpecs wave={makeWave({ canAdmin: false })} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(
      screen.queryByRole("button", { name: "Edit slow mode" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit disable links" })
    ).not.toBeInTheDocument();
  });

  it("opens slow mode editor in a portal outside the specs scroll container", async () => {
    const user = userEvent.setup();
    const { container } = renderWaveSpecs({
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
    renderWaveSpecs({ wave: makeWave({ canAdmin: true }) });

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
    renderWaveSpecs({ wave: makeWave({ canAdmin: true }) });

    await user.click(screen.getByRole("button", { name: "Edit slow mode" }));
    expect(screen.getByLabelText("Slow mode value")).toBeInTheDocument();

    await user.click(screen.getByText("General"));

    await waitFor(() =>
      expect(screen.queryByLabelText("Slow mode value")).not.toBeInTheDocument()
    );
  });

  it("saves slow mode as milliseconds", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({ wave: makeWave({ canAdmin: true }) });

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
    renderWaveSpecs({
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
    renderWaveSpecs({ wave: makeWave({ linksDisabled: true }) });

    expect(screen.getByText("Disable links")).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("saves disable links setting", async () => {
    const user = userEvent.setup();
    renderWaveSpecs({ wave: makeWave({ canAdmin: true }) });

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
