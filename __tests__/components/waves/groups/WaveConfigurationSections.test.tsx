import { render, screen } from "@testing-library/react";
import WaveConfigurationSections from "@/components/waves/groups/WaveConfigurationSections";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/components/waves/specs/WaveTypeIcon", () => ({
  __esModule: true,
  default: ({
    waveType,
    label,
  }: {
    readonly waveType: ApiWaveType;
    readonly label?: string;
  }) => <span>{label ?? waveType}</span>,
}));
jest.mock("@/components/waves/specs/WaveDisableLinks", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="links-setting" data-display={display} />
  ),
}));
jest.mock("@/components/waves/specs/WaveSlowMode", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="slow-mode-setting" data-display={display} />
  ),
}));
jest.mock("@/components/waves/specs/WaveChatStatus", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="chat-status-setting" data-display={display} />
  ),
}));
jest.mock("@/components/waves/groups/WaveConfigurationDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="display-configuration" />,
}));
jest.mock(
  "@/components/waves/groups/WaveConfigurationReadOnlySections",
  () => ({
    __esModule: true,
    default: () => <div data-testid="read-only-configuration" />,
  })
);
jest.mock("@/components/waves/groups/WaveConfigurationRules", () => ({
  __esModule: true,
  default: () => <div data-testid="configuration-rules" />,
}));
jest.mock("@/components/waves/groups/WaveConfigurationAdminSettings", () => ({
  __esModule: true,
  default: () => <div data-testid="admin-settings" />,
}));
jest.mock(
  "@/components/waves/groups/WaveConfigurationDeleteChatHistory",
  () => ({
    __esModule: true,
    default: () => <div data-testid="delete-chat-history" />,
  })
);
jest.mock("@/components/waves/groups/WaveConfigurationPersonalDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="personal-display" />,
}));
jest.mock(
  "@/components/waves/groups/WaveConfigurationPersonalCuration",
  () => ({
    __esModule: true,
    default: () => <div data-testid="personal-curation" />,
  })
);

jest.mock("@/components/waves/specs/groups/group/WaveGroup", () => ({
  __esModule: true,
  default: ({
    type,
    showMembersSummary,
  }: {
    readonly type: WaveGroupType;
    readonly showMembersSummary?: boolean;
  }) => (
    <div
      data-testid={`group-${type}`}
      data-members-summary={showMembersSummary ? "true" : "false"}
    />
  ),
}));

const makeWave = (
  type: ApiWaveType,
  chatEnabled = true,
  decisionsStrategy: object | null = type === ApiWaveType.Rank
    ? { first_decision_time: 123 }
    : null
): any => ({
  visibility: { scope: { group: null } },
  participation: { scope: { group: null } },
  voting: { scope: { group: null } },
  chat: { enabled: chatEnabled, scope: { group: null } },
  wave: {
    type,
    decisions_strategy: decisionsStrategy,
    admin_group: { group: null },
  },
});

describe("WaveConfigurationSections", () => {
  it("renders wave and chat access configuration", () => {
    render(<WaveConfigurationSections wave={makeWave(ApiWaveType.Chat)} />);

    expect(screen.getByRole("heading", { name: "Wave" })).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText(ApiWaveType.Chat)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access" })).toBeInTheDocument();
    expect(
      screen.getByTestId(`group-${WaveGroupType.VIEW}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`group-${WaveGroupType.CHAT}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`group-${WaveGroupType.ADMIN}`)
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByTestId(/^group-/)
        .every((group) => group.getAttribute("data-members-summary") === "true")
    ).toBe(true);
    expect(
      screen.queryByTestId(`group-${WaveGroupType.DROP}`)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`group-${WaveGroupType.VOTE}`)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chat" })).toBeInTheDocument();
    expect(screen.queryByTestId("chat-status-setting")).not.toBeInTheDocument();
    expect(screen.getByTestId("links-setting")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("slow-mode-setting")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("display-configuration")).toBeInTheDocument();
    expect(screen.getByTestId("read-only-configuration")).toBeInTheDocument();
    expect(screen.getByTestId("configuration-rules")).toBeInTheDocument();
    expect(screen.getByTestId("admin-settings")).toBeInTheDocument();
    expect(screen.getByTestId("delete-chat-history")).toBeInTheDocument();
    expect(screen.getByTestId("personal-display")).toBeInTheDocument();
    expect(screen.getByTestId("personal-curation")).toBeInTheDocument();

    const adminSettings = screen.getByTestId("admin-settings");
    const deleteChatHistory = screen.getByTestId("delete-chat-history");
    const personalDisplay = screen.getByTestId("personal-display");
    const personalCuration = screen.getByTestId("personal-curation");
    expect(
      adminSettings.compareDocumentPosition(deleteChatHistory) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      deleteChatHistory.compareDocumentPosition(personalDisplay) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      personalDisplay.compareDocumentPosition(personalCuration) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("includes participation and voting access for competition waves", () => {
    render(<WaveConfigurationSections wave={makeWave(ApiWaveType.Rank)} />);

    expect(
      screen.getByTestId(`group-${WaveGroupType.DROP}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`group-${WaveGroupType.VOTE}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-status-setting")).toHaveAttribute(
      "data-display",
      "configuration"
    );
  });

  it("identifies perpetual rank waves in the Wave section", () => {
    render(
      <WaveConfigurationSections
        wave={makeWave(ApiWaveType.Rank, true, null)}
      />
    );

    expect(screen.getByText("Perpetual Rank")).toBeInTheDocument();
    expect(screen.queryByText(ApiWaveType.Rank)).not.toBeInTheDocument();
  });

  it("keeps chat status available when chat is disabled", () => {
    render(
      <WaveConfigurationSections wave={makeWave(ApiWaveType.Rank, false)} />
    );

    expect(screen.queryByTestId("links-setting")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slow-mode-setting")).not.toBeInTheDocument();
    expect(screen.queryByTestId("personal-display")).not.toBeInTheDocument();
    expect(screen.getByTestId("personal-curation")).toBeInTheDocument();
    expect(screen.getByTestId("chat-status-setting")).toHaveAttribute(
      "data-display",
      "configuration"
    );
  });
});
