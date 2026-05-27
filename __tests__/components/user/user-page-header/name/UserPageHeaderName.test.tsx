import { render, screen } from "@testing-library/react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { CLASSIFICATIONS } from "@/entities/IProfile";
import UserPageHeaderName from "@/components/user/user-page-header/name/UserPageHeaderName";

jest.mock(
  "@/components/user/user-page-header/name/UserPageHeaderNameWrapper",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="name-wrapper">{props.children}</div>
    ),
  })
);

jest.mock(
  "@/components/user/user-page-header/name/classification/UserPageClassificationWrapper",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="classification">{props.children}</div>
    ),
  })
);

jest.mock(
  "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper",
  () => ({
    __esModule: true,
    default: () => <div data-testid="cic-icon" />,
  })
);

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: any) => (
    <div
      data-testid="drop-author-badges"
      data-show-profile-wave-badge={String(props.showProfileWaveBadge)}
    />
  ),
}));

jest.mock("@/components/user/user-page-header/name/CreatedWavesBadge", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="created-waves-badge"
      data-user-handle={props.user.handle ?? ""}
      data-user-primary-address={props.user.primary_address}
    />
  ),
}));

const baseProfile: ApiIdentity = {
  id: "1",
  handle: null,
  normalised_handle: null,
  pfp: null,
  cic: 0,
  rep: 0,
  level: 0,
  tdh: 0,
  consolidation_key: "",
  display: "",
  primary_wallet: "",
  banner1: null,
  banner2: null,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};

function renderComponent(profile: Partial<ApiIdentity>, mainAddress = "0xabc") {
  const combined = { ...baseProfile, ...profile } as ApiIdentity;
  return render(
    <UserPageHeaderName
      profile={combined}
      canEdit={false}
      mainAddress={mainAddress}
      level={combined.level}
      profileEnabledAt={null}
    />
  );
}

describe("UserPageHeaderName", () => {
  it("shows handle and classification when handle exists", () => {
    renderComponent({
      handle: "Alice",
      classification: ApiProfileClassification.Bot,
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByText(CLASSIFICATIONS[ApiProfileClassification.Bot].title)
    ).toBeInTheDocument();
  });

  it("shows display when handle missing", () => {
    renderComponent({ handle: null, display: "Display Name" });
    expect(screen.getByText("Display Name")).toBeInTheDocument();
  });

  it("falls back to main address when no other name", () => {
    renderComponent({ handle: null, display: "" }, "0x123");
    expect(screen.getByText("0x123")).toBeInTheDocument();
  });

  it("shows a robot emoji for AI classification", () => {
    renderComponent({
      handle: "Robo",
      classification: ApiProfileClassification.Ai,
    });

    expect(screen.getByText("🤖")).toBeInTheDocument();
    expect(screen.getByText("AI profile")).toHaveClass("tw-sr-only");
    expect(screen.getByTestId("name-wrapper")).toHaveTextContent("Robo");
  });

  it("does not show a robot emoji for non-AI classifications", () => {
    renderComponent({
      handle: "Alice",
      classification: ApiProfileClassification.Organization,
    });

    expect(screen.queryByText("🤖")).not.toBeInTheDocument();
  });

  it("keeps author badges from rendering the profile wave badge in the profile header", () => {
    renderComponent({
      handle: "Alice",
      profile_wave_id: "featured-wave",
    });

    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-show-profile-wave-badge",
      "false"
    );
  });

  it("shows the created-waves badge for wave creators in the profile header", () => {
    renderComponent({
      handle: "Alice",
      primary_wallet: "0xalice",
      is_wave_creator: true,
    });

    expect(screen.getByTestId("created-waves-badge")).toHaveAttribute(
      "data-user-handle",
      "Alice"
    );
    expect(screen.getByTestId("created-waves-badge")).toHaveAttribute(
      "data-user-primary-address",
      "0xalice"
    );
  });
});
