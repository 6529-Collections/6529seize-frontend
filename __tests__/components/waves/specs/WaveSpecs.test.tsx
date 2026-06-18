import WaveSpecs from "@/components/waves/specs/WaveSpecs";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveParticipationIdentitySubmissionAllowDuplicates } from "@/generated/models/ApiWaveParticipationIdentitySubmissionAllowDuplicates";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/waves/specs/WaveTypeIcon", () => () => (
  <div data-testid="wave-type-icon" />
));
jest.mock("@/components/waves/specs/WaveRating", () => () => (
  <div data-testid="wave-rating" />
));
jest.mock("@/components/waves/specs/WaveAuthor", () => () => (
  <div data-testid="wave-author" />
));

const makeWave = (
  overrides: {
    readonly waveType?: ApiWaveType | undefined;
    readonly creditScope?: ApiWaveCreditScope | undefined;
    readonly submissionStrategy?: any;
    readonly parentWave?: { readonly id: string; readonly name?: string };
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
    credit_scope: overrides.creditScope ?? ApiWaveCreditScope.Wave,
    signature_required: false,
    period: null,
    forbid_negative_votes: false,
  },
  visibility: { scope: { group: null } },
  chat: {
    scope: { group: null },
    enabled: true,
    authenticated_user_eligible: true,
    links_disabled: false,
    slow_mode_cooldown_ms: undefined,
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
    submission_strategy: overrides.submissionStrategy ?? null,
  },
  wave: {
    admin_drop_deletion_enabled: false,
    type: overrides.waveType ?? ApiWaveType.Chat,
    winning_threshold: null,
    winning_threshold_min_duration_ms: null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    admin_group: { group: null },
    decisions_strategy: null,
    authenticated_user_eligible_for_admin: false,
  },
  metrics: { your_participation_drops_count: 0 },
  parent_wave: overrides.parentWave,
});

describe("WaveSpecs", () => {
  it("renders the overview heading", () => {
    render(<WaveSpecs wave={makeWave()} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.queryByText("General")).not.toBeInTheDocument();
  });

  it("hides voting for chat waves", () => {
    render(<WaveSpecs wave={makeWave({ waveType: ApiWaveType.Chat })} />);

    expect(screen.queryByText("Voting")).not.toBeInTheDocument();
    expect(screen.queryByText("Voting power")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wave-rating")).not.toBeInTheDocument();
  });

  it("shows voting for non-chat waves", () => {
    render(<WaveSpecs wave={makeWave({ waveType: ApiWaveType.Rank })} />);

    expect(screen.getByText("Voting")).toBeInTheDocument();
    expect(screen.getByTestId("wave-rating")).toBeInTheDocument();
    expect(screen.getByText("Voting power")).toBeInTheDocument();
    expect(screen.getByText("Whole wave")).toBeInTheDocument();
  });

  it("shows each-drop voting power scope", () => {
    render(
      <WaveSpecs
        wave={makeWave({
          waveType: ApiWaveType.Rank,
          creditScope: ApiWaveCreditScope.Drop,
        })}
      />
    );

    expect(screen.getByText("Voting power")).toBeInTheDocument();
    expect(screen.getByText("Each drop")).toBeInTheDocument();
  });

  it("shows linked parent wave row for subwaves", () => {
    render(
      <WaveSpecs
        wave={makeWave({
          parentWave: { id: "parent-wave", name: "Parent Wave" },
        })}
      />
    );

    expect(screen.getByText("Parent wave")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parent Wave" })).toHaveAttribute(
      "href",
      "/waves/parent-wave"
    );
  });

  it("hides parent wave row for root waves", () => {
    render(<WaveSpecs wave={makeWave()} />);

    expect(screen.queryByText("Parent wave")).toBeNull();
  });

  it("keeps approve edit settings out of overview", () => {
    render(<WaveSpecs wave={makeWave({ waveType: ApiWaveType.Approve })} />);

    expect(screen.queryByText("Approval tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("Approvals tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Approval rule")).not.toBeInTheDocument();
    expect(screen.queryByText("Approve after")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit approve after" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit approvals tab label" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit approved tab label" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit hold time" })
    ).not.toBeInTheDocument();
  });

  it("shows identity submission summaries in the overview block when configured", () => {
    render(
      <WaveSpecs
        wave={makeWave({
          submissionStrategy: {
            type: ApiWaveParticipationSubmissionStrategyType.Identity,
            config: {
              who_can_be_submitted:
                ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
              duplicates:
                ApiWaveParticipationIdentitySubmissionAllowDuplicates.AllowAfterWin,
            },
          },
        })}
      />
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Eligible identities")).toBeInTheDocument();
    expect(screen.getByText("Others only")).toBeInTheDocument();
    expect(screen.getByText("Repeat submissions")).toBeInTheDocument();
    expect(screen.getByText("After it wins")).toBeInTheDocument();
    expect(screen.queryByText("Identity submissions")).not.toBeInTheDocument();
  });
});
