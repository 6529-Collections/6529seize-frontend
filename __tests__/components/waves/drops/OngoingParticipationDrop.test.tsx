import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import OngoingParticipationDrop from "@/components/waves/drops/participation/OngoingParticipationDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

// Mock hooks and child components
const useIsMobileDevice = jest.fn();
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: (...args: any[]) => useIsMobileDevice(...args),
}));
const useHasTouchInput = jest.fn();
jest.mock("@/hooks/useHasTouchInput", () => ({
  __esModule: true,
  default: (...args: any[]) => useHasTouchInput(...args),
}));
const useIsTouchDevice = jest.fn();
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: (...args: any[]) => useIsTouchDevice(...args),
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: () => ({ canShowVote: true }),
}));
jest.mock("@/components/voting", () => ({
  VotingModal: ({ isOpen }: any) => (
    <div data-testid="voting-modal" data-open={String(isOpen)} />
  ),
  MobileVotingModal: ({ isOpen }: any) => (
    <div data-testid="mobile-voting-modal" data-open={String(isOpen)} />
  ),
}));
jest.mock("@/components/voting/VotingModalButton", () => ({
  __esModule: true,
  default: ({ onClick }: any) => (
    <button data-testid="vote-button" onClick={onClick} type="button">
      Vote
    </button>
  ),
}));

jest.mock("@/components/waves/drops/WaveDropActions", () => (props: any) => (
  <div data-testid="actions" onClick={props.onReply}></div>
));

let longPressCb: () => void;
let participationDropContentProps: any;

jest.mock(
  "@/components/waves/drops/participation/ParticipationDropContent",
  () => (props: any) => {
    longPressCb = props.onLongPress;
    participationDropContentProps = props;
    return (
      <button data-testid="content" onClick={() => longPressCb()}></button>
    );
  }
);

let mobileMenuProps: any;
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => (props: any) => {
  mobileMenuProps = props;
  return <div data-testid="mobile-menu" data-open={props.isOpen}></div>;
});

jest.mock(
  "@/components/waves/drops/participation/ParticipationDropHeader",
  () => () => <div />
);
const ParticipationDropMetadataMock = jest.fn(() => (
  <div data-testid="metadata" />
));
jest.mock(
  "@/components/waves/drops/participation/ParticipationDropMetadata",
  () => (props: any) => {
    ParticipationDropMetadataMock(props);
    return <div data-testid="metadata" />;
  }
);
let footerProps: any;
jest.mock(
  "@/components/waves/drops/participation/ParticipationDropFooter",
  () => (props: any) => {
    footerProps = props;
    return (
      <div
        data-testid="footer"
        data-is-voting-closed={String(props.isVotingClosed)}
        data-is-voting-controls-locked={String(props.isVotingControlsLocked)}
      >
        {props.voteAction}
      </div>
    );
  }
);
jest.mock(
  "@/components/waves/drops/participation/ParticipationDropContainer",
  () => (props: any) => (
    <div>
      {props.floatingActions}
      {props.children}
    </div>
  )
);
jest.mock("@/components/waves/drops/WaveDropAuthorPfp", () => () => <div />);
const ParticipationIdentityProfileCardMock = jest.fn(({ profile }: any) => (
  <div data-testid="identity-card">
    {profile.handle ?? profile.primary_address}
  </div>
));
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

const drop: ExtendedDrop = {
  id: "d1",
  parts: [{ part_id: "p1" }],
  metadata: [],
  wave: { id: "w1", submission_type: null } as any,
} as any;

const HOVER_INPUT_MEDIA_QUERIES = new Set([
  "(any-hover: hover)",
  "(hover: hover)",
]);

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

/** Mocks hover media queries used by drop action interaction mode. */
const setHoverSupport = (hasHover: boolean) => {
  const matchMedia = jest.fn((query: string) => ({
    matches: hasHover && HOVER_INPUT_MEDIA_QUERIES.has(query),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "matchMedia");
  if (descriptor && !descriptor.configurable) {
    if (descriptor.writable) {
      globalThis.matchMedia = matchMedia;
    } else if (jest.isMockFunction(descriptor.value)) {
      descriptor.value.mockImplementation(matchMedia);
    }
    return;
  }

  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
};

/** Renders an ongoing participation drop in the requested layout mode. */
const renderComp = ({
  mobile = false,
  dropOverride = drop,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  onDropContentClick,
  showInteractions = true,
}: {
  readonly mobile?: boolean;
  readonly dropOverride?: ExtendedDrop;
  readonly isVotingClosed?: boolean;
  readonly isVotingControlsLocked?: boolean;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly showInteractions?: boolean | undefined;
} = {}) => {
  const onReply = jest.fn();
  useIsMobileDevice.mockReturnValue(mobile);
  setViewportWidth(mobile ? 390 : 1440);
  const view = render(
    <OngoingParticipationDrop
      drop={dropOverride}
      showWaveInfo={false}
      activeDrop={null}
      showReplyAndQuote={true}
      location="wave"
      onReply={onReply}
      onQuoteClick={jest.fn()}
      onDropContentClick={onDropContentClick}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      showInteractions={showInteractions}
    />
  );
  return { onReply, ...view };
};

describe("OngoingParticipationDrop", () => {
  beforeEach(() => {
    ParticipationDropMetadataMock.mockClear();
    ParticipationIdentityProfileCardMock.mockClear();
    participationDropContentProps = undefined;
    mobileMenuProps = undefined;
    footerProps = undefined;
    useHasTouchInput.mockReturnValue(false);
    useIsTouchDevice.mockReturnValue(false);
    setViewportWidth(1440);
    setHoverSupport(false);
  });

  it("shows actions on desktop", () => {
    setHoverSupport(true);

    renderComp();
    expect(screen.getByTestId("actions")).toBeInTheDocument();
  });

  it("opens mobile menu on long press and handles reply", async () => {
    const user = userEvent.setup();
    const { onReply } = renderComp({ mobile: true });
    await user.click(screen.getByTestId("content")); // triggers long press
    expect(mobileMenuProps.isOpen).toBe(true);
    await user.click(screen.getByTestId("mobile-menu"));
    mobileMenuProps.onReply();
    expect(onReply).toHaveBeenCalledWith({ drop, partId: "p1" });
    expect(mobileMenuProps.setOpen).toBeDefined();
  });

  it("opens mobile menu on wide touch-only viewports without hover", async () => {
    const user = userEvent.setup();
    useHasTouchInput.mockReturnValue(true);
    useIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    renderComp();

    expect(screen.queryByTestId("actions")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("content"));

    expect(participationDropContentProps.hasTouch).toBe(true);
    expect(mobileMenuProps.isOpen).toBe(true);
  });

  it("clears an open touch sheet when the mode switches to desktop hover", () => {
    useHasTouchInput.mockReturnValue(true);
    useIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    const { rerender } = renderComp();

    act(() => {
      participationDropContentProps.onLongPress();
    });

    expect(mobileMenuProps.isOpen).toBe(true);

    setHoverSupport(true);
    rerender(
      <OngoingParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location="wave"
        onReply={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mobileMenuProps.isOpen).toBe(false);

    setHoverSupport(false);
    rerender(
      <OngoingParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location="wave"
        onReply={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(mobileMenuProps.isOpen).toBe(false);
  });

  it("does not enable content touch handling when interactions are disabled", () => {
    useHasTouchInput.mockReturnValue(true);
    useIsTouchDevice.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    renderComp({
      onDropContentClick: jest.fn(),
      showInteractions: false,
    });

    expect(participationDropContentProps.hasTouch).toBe(false);
    expect(mobileMenuProps).toBeUndefined();
  });

  it("hides voting in the mobile menu when voting is closed", async () => {
    const user = userEvent.setup();
    renderComp({ mobile: true, isVotingClosed: true });
    await user.click(screen.getByTestId("content"));

    expect(
      (mobileMenuProps as { readonly showVoting?: boolean }).showVoting
    ).toBe(false);
  });

  it("locks vote actions without marking ratings closed", async () => {
    const user = userEvent.setup();
    renderComp({ mobile: true, isVotingControlsLocked: true });
    await user.click(screen.getByTestId("content"));

    expect(screen.queryByTestId("vote-button")).not.toBeInTheDocument();
    expect(footerProps.isVotingClosed).toBe(false);
    expect(footerProps.isVotingControlsLocked).toBe(true);
    expect(
      (mobileMenuProps as { readonly showVoting?: boolean }).showVoting
    ).toBe(false);
  });

  it("closes the voting modal when voting closes", async () => {
    const user = userEvent.setup();
    useIsMobileDevice.mockReturnValue(false);
    const onReply = jest.fn();
    const onQuoteClick = jest.fn();
    const { rerender } = render(
      <OngoingParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location="wave"
        onReply={onReply}
        onQuoteClick={onQuoteClick}
      />
    );

    await user.click(screen.getByTestId("vote-button"));

    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "true"
    );

    rerender(
      <OngoingParticipationDrop
        drop={drop}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location="wave"
        onReply={onReply}
        onQuoteClick={onQuoteClick}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
    expect(screen.queryByTestId("vote-button")).toBeNull();
  });

  it("renders the identity profile card and filters identity metadata", () => {
    const identityDrop = {
      ...drop,
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
      wave: {
        ...drop.wave,
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
    } as ExtendedDrop;

    renderComp({ dropOverride: identityDrop });

    expect(screen.getByTestId("identity-card")).toHaveTextContent("bob");
    expect(ParticipationIdentityProfileCardMock).toHaveBeenCalledTimes(1);
    expect(
      ParticipationDropMetadataMock.mock.calls.at(-1)?.[0]?.metadata
    ).toEqual([{ data_key: "title", data_value: "drop title" }]);
  });
});
