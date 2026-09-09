import { render, screen } from "@testing-library/react";
import WaveDisableLinks from "@/components/waves/specs/WaveDisableLinks";
import WaveChatStatus from "@/components/waves/specs/WaveChatStatus";
import WaveSlowMode from "@/components/waves/specs/WaveSlowMode";
import { useWaveSettingUpdater } from "@/components/waves/specs/useWaveSettingUpdater";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/components/waves/specs/useWaveSettingUpdater", () => ({
  useWaveSettingUpdater: jest.fn(),
}));

const useWaveSettingUpdaterMock = useWaveSettingUpdater as jest.Mock;

const makeWave = ({
  chatEnabled = true,
  linksDisabled = false,
  slowModeCooldownMs = null,
}: {
  readonly chatEnabled?: boolean;
  readonly linksDisabled?: boolean;
  readonly slowModeCooldownMs?: number | null;
} = {}): ApiWave =>
  ({
    chat: {
      enabled: chatEnabled,
      scope: { group: null },
      links_disabled: linksDisabled,
      slow_mode_cooldown_ms: slowModeCooldownMs,
    },
  }) as ApiWave;

const renderChatSettings = (wave = makeWave()) =>
  render(
    <>
      <WaveChatStatus wave={wave} display="configuration" />
      <WaveDisableLinks wave={wave} display="configuration" />
      <WaveSlowMode wave={wave} display="configuration" />
    </>
  );

describe("Configuration chat settings", () => {
  beforeEach(() => {
    useWaveSettingUpdaterMock.mockReturnValue({
      canEdit: true,
      mutating: false,
      saveChatUpdate: jest.fn(),
      setToast: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows live values and administrator gear controls", () => {
    renderChatSettings();

    expect(screen.getByText("Chat status")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Allowed")).toBeInTheDocument();
    expect(screen.getByText("Slow mode")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit links" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Edit chat status" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Edit slow mode" })
    ).toBeVisible();
  });

  it("does not expose gear controls to a read-only viewer", () => {
    useWaveSettingUpdaterMock.mockReturnValue({
      canEdit: false,
      mutating: false,
      saveChatUpdate: jest.fn(),
      setToast: jest.fn(),
    });

    renderChatSettings(
      makeWave({
        chatEnabled: false,
        linksDisabled: true,
        slowModeCooldownMs: 30_000,
      })
    );

    expect(screen.getAllByText("Disabled")).toHaveLength(2);
    expect(screen.getByText("On · 30s")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit links" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit chat status" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit slow mode" })
    ).not.toBeInTheDocument();
  });
});
