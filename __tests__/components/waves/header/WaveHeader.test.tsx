import { render, screen } from "@testing-library/react";
import React from "react";
import WaveHeader from "@/components/waves/header/WaveHeader";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("@/components/waves/header/WaveHeaderFollow", () => (props: any) => (
  <div
    data-full-width={String(props.fullWidth)}
    data-testid="wave-header-follow"
  />
));
jest.mock(
  "@/components/waves/header/options/WaveHeaderOptions",
  () => (props: any) => (
    <div
      data-testid="wave-header-options"
      data-show-owner={String(props.showOwnerActions)}
    />
  )
);
jest.mock("@/components/waves/header/name/WaveHeaderName", () => () => (
  <div data-testid="name" />
));
jest.mock("@/components/waves/header/WaveHeaderFollowers", () => () => <div />);
jest.mock("@/components/waves/header/WaveHeaderDescription", () => () => (
  <div data-testid="description" />
));
jest.mock("@/components/waves/header/WaveHeaderPinButton", () => () => (
  <div data-testid="wave-header-pin" />
));
jest.mock("@/components/waves/WavePicture", () => () => <div />);
jest.mock("@/components/waves/specs/WaveNotificationSettings", () => () => (
  <div data-testid="wave-notification-settings" />
));
jest.mock("@/helpers/waves/waves.helpers", () => ({ canEditWave: jest.fn() }));

const { canEditWave } = require("@/helpers/waves/waves.helpers");

const baseWave: any = {
  id: "w",
  name: "Wave",
  created_at: 0,
  picture: "p",
  author: { handle: "a", banner1_color: "#000", banner2_color: "#111" },
  contributors_overview: [],
  metrics: { drops_count: 1 },
  chat: { scope: { group: { is_direct_message: false } } },
  wave: { type: ApiWaveType.Chat },
  subscribed_actions: [],
};

describe("WaveHeader", () => {
  beforeEach(() => {
    (canEditWave as jest.Mock).mockReset();
    (canEditWave as jest.Mock).mockReturnValue(false);
  });

  const wrapper = (wave: any, props?: any, auth?: any) =>
    render(
      <AuthContext.Provider
        value={
          { connectedProfile: null, activeProfileProxy: null, ...auth } as any
        }
      >
        <WaveHeader wave={wave} onFollowersClick={jest.fn()} {...props} />
      </AuthContext.Provider>
    );

  it("shows drop icon when wave not chat", () => {
    wrapper({ ...baseWave, wave: { type: ApiWaveType.Approve } });
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("omits drop icon for chat waves and applies ring classes", () => {
    const { container } = wrapper(baseWave, {
      useRing: false,
      useRounded: false,
    });
    expect(document.querySelector("svg")).toBeNull();
    expect(container.firstChild?.firstChild).not.toHaveClass("tw-ring-1");
  });

  it("shows picture edit action for editable non-DM waves", () => {
    (canEditWave as jest.Mock).mockReturnValue(true);
    wrapper(baseWave);
    const editPicture = screen.getByLabelText("Edit wave picture");
    expect(editPicture).toBeInTheDocument();
    expect(screen.getAllByLabelText("Edit wave picture")).toHaveLength(1);
    expect(editPicture).toHaveClass(
      "tw-hidden",
      "desktop-hover:group-hover:tw-flex",
      "touch-only:tw-flex"
    );
  });

  it("hides picture edit action for DM waves even when editable", () => {
    (canEditWave as jest.Mock).mockReturnValue(true);
    wrapper({
      ...baseWave,
      chat: { scope: { group: { is_direct_message: true } } },
    });
    expect(screen.queryByLabelText("Edit wave picture")).toBeNull();
  });

  it("shows pin action for root waves", () => {
    wrapper(
      { ...baseWave, subscribed_actions: ["drop_created"] },
      undefined,
      { connectedProfile: { handle: "alice" } }
    );

    expect(screen.getByTestId("wave-header-pin")).toBeInTheDocument();
  });

  it("hides pin action for subwaves", () => {
    wrapper(
      {
        ...baseWave,
        parent_wave: { id: "parent-wave" },
      },
      undefined,
      { connectedProfile: { handle: "alice" } }
    );

    expect(screen.queryByTestId("wave-header-pin")).toBeNull();
  });

  it("only mounts create-subwave options for eligible top-level waves", () => {
    wrapper(
      {
        ...baseWave,
        wave: {
          ...baseWave.wave,
          authenticated_user_eligible_for_admin: true,
        },
      },
      undefined,
      { connectedProfile: { handle: "alice" } }
    );

    expect(screen.getByTestId("wave-header-options")).toHaveAttribute(
      "data-show-owner",
      "false"
    );
  });

  it("does not mount create-subwave options for eligible subwaves", () => {
    wrapper(
      {
        ...baseWave,
        parent_wave: { id: "parent-wave" },
        wave: {
          ...baseWave.wave,
          authenticated_user_eligible_for_admin: true,
        },
      },
      undefined,
      { connectedProfile: { handle: "alice" } }
    );

    expect(screen.queryByTestId("wave-header-options")).toBeNull();
  });
});
