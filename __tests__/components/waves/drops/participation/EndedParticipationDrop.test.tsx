import { render, screen } from "@testing-library/react";
import React from "react";
import EndedParticipationDrop from "@/components/waves/drops/participation/EndedParticipationDrop";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { DropLocation } from "@/components/waves/drops/drop.types";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
const mockUseIsMobileDevice = jest.fn(() => true);
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseIsMobileDevice(...args),
}));

const WaveDropContentMock = jest.fn(() => null);
const WaveDropMobileMenuMock = jest.fn(() => null);
const WaveDropMetadataMock = jest.fn(() => null);
const ParticipationIdentityProfileCardMock = jest.fn(({ profile }: any) => (
  <div data-testid="identity-card">
    {profile.handle ?? profile.primary_address}
  </div>
));
jest.mock("@/components/waves/drops/WaveDropContent", () => (props: any) => {
  WaveDropContentMock(props);
  return <div data-testid="content" />;
});
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => (props: any) => {
  WaveDropMobileMenuMock(props);
  return <div data-testid="menu" />;
});
jest.mock("@/components/waves/drops/WaveDropActions", () => (props: any) => (
  <button data-testid="actions" onClick={props.onReply} type="button">
    Actions
  </button>
));
jest.mock("@/components/waves/drops/WaveDropMetadata", () => (props: any) => {
  WaveDropMetadataMock(props);
  return <div data-testid="metadata" />;
});
jest.mock(
  "@/components/waves/drops/participation/ParticipationIdentityProfileCard",
  () => (props: any) => {
    ParticipationIdentityProfileCardMock(props);
    return (
      <div data-testid="identity-card">
        {props.profile.handle ?? props.profile.primary_address}
      </div>
    );
  }
);

const drop: any = {
  id: "d",
  created_at: 1,
  wave: { id: "w", name: "W", submission_type: null },
  author: { handle: "alice", level: 1, cic: {} },
  parts: [{ part_id: 1 }],
  metadata: [],
};

describe("EndedParticipationDrop", () => {
  beforeEach(() => {
    mockUseIsMobileDevice.mockReturnValue(true);
    WaveDropContentMock.mockClear();
    WaveDropMobileMenuMock.mockClear();
    WaveDropMetadataMock.mockClear();
    ParticipationIdentityProfileCardMock.mockClear();
  });

  it("opens mobile menu on long press", () => {
    const { rerender } = render(
      <EndedParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    // Initially menu should be closed
    expect(WaveDropMobileMenuMock.mock.calls[0][0]?.isOpen).toBe(false);

    // Trigger onLongPress prop from WaveDropContent
    const onLongPress = WaveDropContentMock.mock.calls[0][0]?.onLongPress;
    onLongPress();

    // Force a re-render to check updated state
    rerender(
      <EndedParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    // After long press, menu should be open
    expect(WaveDropMobileMenuMock.mock.calls[1][0]?.isOpen).toBe(true);
  });

  it("renders desktop actions outside the clipped card", () => {
    mockUseIsMobileDevice.mockReturnValue(false);

    render(
      <EndedParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={DropLocation.WAVE}
        onReply={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    const actions = screen.getByTestId("actions");
    const shell = actions.parentElement;
    const clippedCard = shell?.querySelector(".tw-overflow-hidden");

    expect(shell?.className).toContain("tw-group");
    expect(shell?.className).toContain("tw-relative");
    expect(shell?.className).not.toContain("tw-overflow-hidden");
    expect(clippedCard).not.toBeNull();
    expect(clippedCard?.className).toContain("tw-rounded-xl");
    expect(clippedCard?.contains(actions)).toBe(false);
  });

  it("renders the identity profile card and filters identity metadata", () => {
    const identityDrop = {
      ...drop,
      wave: {
        ...drop.wave,
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
      metadata: [
        {
          data_key: "identity",
          data_value: "0xabc",
          resolved_profile: {
            id: "p1",
            handle: "bob",
            primary_address: "0xabc",
            pfp: null,
            banner1_color: null,
            banner2_color: null,
            cic: 12,
            rep: 34,
            tdh: 56,
            tdh_rate: 1,
            xtdh: 78,
            xtdh_rate: 2,
            level: 3,
            subscribed_actions: [],
            archived: false,
            active_main_stage_submission_ids: [],
            winner_main_stage_drop_ids: [],
            artist_of_prevote_cards: [],
            is_wave_creator: false,
          },
        },
        { data_key: "title", data_value: "drop title" },
      ],
    };

    render(
      <EndedParticipationDrop
        drop={identityDrop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity-card")).toHaveTextContent("bob");
    expect(ParticipationIdentityProfileCardMock).toHaveBeenCalledTimes(1);
    expect(WaveDropMetadataMock.mock.calls.at(-1)?.[0]?.metadata).toEqual([
      { data_key: "title", data_value: "drop title" },
    ]);
  });
});
