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

jest.mock(
  "@/components/user/user-page-header/name/ProfileCurationBadge",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div
        data-testid="profile-curation-badge"
        data-profile-wave-id={props.profile.profile_wave_id ?? ""}
      />
    ),
  })
);

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

function renderComponent(
  profile: Partial<ApiIdentity>,
  mainAddress = "0xabc",
  profileEnabledAt: string | null = null
) {
  const combined = { ...baseProfile, ...profile } as ApiIdentity;
  return render(
    <UserPageHeaderName
      profile={combined}
      canEdit={false}
      mainAddress={mainAddress}
      level={combined.level}
      profileEnabledAt={profileEnabledAt}
    />
  );
}

describe("UserPageHeaderName", () => {
  it("shows handle and classification when handle exists", () => {
    renderComponent({
      handle: "Alice",
      classification: ApiProfileClassification.Bot,
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Alice" })
    ).toBeInTheDocument();
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

  it("renders the lowercased main address for wallet-only profiles", () => {
    renderComponent(
      { handle: null, display: "", primary_wallet: "0xAbCdEf" },
      "0xabcdef"
    );
    expect(screen.getByText("0xabcdef")).toBeInTheDocument();
    expect(screen.queryByText("0xAbCdEf")).not.toBeInTheDocument();
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

  it("passes profile wave data through the profile curation badge", () => {
    renderComponent({
      handle: "Alice",
      profile_wave_id: "featured-wave",
    });

    expect(screen.getByTestId("profile-curation-badge")).toHaveAttribute(
      "data-profile-wave-id",
      "featured-wave"
    );
  });

  it("renders the message-backed profile-enabled date", () => {
    renderComponent({ handle: "Alice" }, "0x123", "2024-01-01T00:00:00.000Z");

    expect(
      screen.getByText("Profile enabled: January 2024")
    ).toBeInTheDocument();
  });
});
