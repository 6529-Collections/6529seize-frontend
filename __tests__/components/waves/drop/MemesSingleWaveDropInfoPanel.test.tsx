import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesSingleWaveDropInfoPanel } from "@/components/waves/drop/MemesSingleWaveDropInfoPanel";
import { ApiDropType } from "@/generated/models/ApiDropType";

const mockUseDropInteractionRules = jest.fn();
const mockUseWaveRankReward = jest.fn(() => ({
  nicTotal: 0,
  repTotal: 0,
  manualOutcomes: [],
}));
let mockIsMobileScreen = false;

jest.mock("framer-motion", () => ({
  motion: { div: (p: any) => <div {...p} /> },
  m: { div: (p: any) => <div {...p} /> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  LazyMotion: ({ children }: any) => <div>{children}</div>,
  domAnimation: {},
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => <svg data-testid="fa" {...p} />,
}));
jest.mock("@/components/waves/drop/SingleWaveDropInfoDetails", () => ({
  SingleWaveDropInfoDetails: () => <div data-testid="details" />,
}));
jest.mock("@/components/waves/drop/SingleWaveDropInfoAuthorSection", () => ({
  SingleWaveDropInfoAuthorSection: () => <div data-testid="author" />,
}));
jest.mock("@/components/waves/drop/SingleWaveDropPosition", () => ({
  SingleWaveDropPosition: ({ rank }: any) => (
    <div
      data-testid="position"
      data-rank={rank === null ? "null" : String(rank)}
    />
  ),
}));
jest.mock("@/components/waves/drop/SingleWaveDropVotes", () => ({
  SingleWaveDropVotes: () => <div data-testid="votes" />,
}));
jest.mock("@/components/waves/drop/WinnerBadge", () => ({
  WinnerBadge: () => <div data-testid="badge" />,
}));
jest.mock("@/components/waves/drop/SingleWaveDropTraits", () => ({
  SingleWaveDropTraits: () => <div data-testid="traits" />,
}));
jest.mock("@/components/waves/drop/WaveDropAdditionalInfo", () => ({
  WaveDropAdditionalInfo: () => <div data-testid="process" />,
}));
jest.mock("@/components/utils/button/WaveDropDeleteButton", () => ({
  __esModule: true,
  default: () => <div data-testid="delete" />,
}));
jest.mock("@/components/voting", () => ({
  __esModule: true,
  MobileVotingModal: ({ isOpen }: any) => (
    <div data-testid="mobile-voting-modal" data-open={String(isOpen)} />
  ),
  VotingModal: ({ isOpen }: any) => (
    <div data-testid="desktop-voting-modal" data-open={String(isOpen)} />
  ),
}));
jest.mock("@/components/waves/memes/submission/MemesArtResubmitAction", () => ({
  MemesArtResubmitAction: (p: any) => (
    <button data-testid="resubmit" onClick={p.onSourceDropDeleted}>
      resubmit
    </button>
  ),
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => (props: any) => {
    const mediaMimeType = props.media_mime_type ?? "";
    const isImage = mediaMimeType.includes("image");
    const isVideo = mediaMimeType.includes("video");
    const showsToolbar = !props.disableModal && (isImage || isVideo);

    return (
      <div
        data-testid="media"
        data-disable-modal={String(Boolean(props.disableModal))}
        data-media-mime-type={mediaMimeType}
        data-media-url={props.media_url}
      >
        {showsToolbar && (
          <>
            {isImage && <button type="button">Full screen</button>}
            <button type="button">Open in new tab</button>
            <button type="button">Download media</button>
          </>
        )}
      </div>
    );
  }
);
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: (drop: any) => mockUseDropInteractionRules(drop),
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => mockIsMobileScreen,
}));
jest.mock("@/hooks/waves/useWaveRankReward", () => ({
  useWaveRankReward: (args: any) => mockUseWaveRankReward(args),
}));

const baseDrop: any = {
  id: "drop-1",
  drop_type: ApiDropType.Participatory,
  rank: 1,
  rating: 10,
  rating_prediction: 10,
  created_at: 1700000000000,
  wave: {
    id: "w1",
    voting_credit_type: "REP",
  },
  metadata: [
    { data_key: "title", data_value: "Title" },
    { data_key: "description", data_value: "Desc" },
  ],
  parts: [{ media: [{ mime_type: "image/png", url: "img.png" }] }],
};

const dropWithMedia = (mime_type: string, url = "media") => ({
  ...baseDrop,
  parts: [{ media: [{ mime_type, url }] }],
});

describe("MemesSingleWaveDropInfoPanel", () => {
  beforeEach(() => {
    Object.defineProperty(document.body, "requestFullscreen", {
      configurable: true,
      value: jest.fn(),
    });
    mockIsMobileScreen = false;
    mockUseDropInteractionRules.mockReset();
    mockUseWaveRankReward.mockClear();
    mockUseDropInteractionRules.mockReturnValue({
      isWinner: true,
      canDelete: true,
      canShowVote: false,
      isVotingEnded: true,
    });
  });

  it("renders drop info and delete button", () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-url",
      "img.png"
    );
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-disable-modal",
      "false"
    );
    expect(screen.getByTestId("traits")).toBeInTheDocument();
    expect(screen.getByTestId("process")).toBeInTheDocument();
    expect(screen.getByTestId("author")).toBeInTheDocument();
    expect(screen.getByTestId("details")).toBeInTheDocument();
    expect(screen.getByTestId("delete")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
  });

  it("uses compact responsive media sizing before the desktop breakpoint", () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);

    const mediaFrame = screen.getByTestId("media").parentElement;
    const heroWrapper = mediaFrame?.parentElement?.parentElement?.parentElement;

    expect(mediaFrame).toHaveClass(
      "tw-h-[clamp(18rem,75vw,calc(100dvh-8rem))]"
    );
    expect(mediaFrame).toHaveClass("lg:tw-h-[95vh]");
    expect(heroWrapper).toHaveClass("lg:tw-min-h-screen");
    expect(heroWrapper).not.toHaveClass("tw-min-h-screen");
  });

  it("uses the standard image media toolbar and modal path", () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);

    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-disable-modal",
      "false"
    );
    expect(screen.getByRole("button", { name: "Full screen" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeVisible();
  });

  it("uses the standard video media toolbar without fullscreen", () => {
    render(
      <MemesSingleWaveDropInfoPanel
        drop={dropWithMedia("video/mp4", "video.mp4")}
        wave={null}
      />
    );

    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-url",
      "video.mp4"
    );
    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeVisible();
  });

  it.each([
    ["text/html", "interactive.html"],
    ["model/gltf-binary", "model.glb"],
  ])("hides fullscreen while rendering %s hero media", (mime_type, url) => {
    render(
      <MemesSingleWaveDropInfoPanel
        drop={dropWithMedia(mime_type, url)}
        wave={null}
      />
    );

    expect(screen.getByTestId("media")).toHaveAttribute("data-media-url", url);
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-mime-type",
      mime_type
    );
    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
  });

  it("passes single-drop close callback to resubmit source deletion", async () => {
    const onClose = jest.fn();

    render(
      <MemesSingleWaveDropInfoPanel
        drop={baseDrop}
        wave={{ id: "w1" } as any}
        onClose={onClose}
      />
    );

    await userEvent.click(screen.getByTestId("resubmit"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Vote and opens the desktop modal when voting is unlocked", () => {
    mockUseDropInteractionRules.mockReturnValue({
      isWinner: false,
      canDelete: false,
      canShowVote: true,
      isVotingEnded: false,
    });

    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));

    expect(screen.getByTestId("desktop-voting-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("hides Vote and keeps the desktop modal closed when voting is locked", () => {
    mockUseDropInteractionRules.mockReturnValue({
      isWinner: false,
      canDelete: false,
      canShowVote: true,
      isVotingEnded: false,
    });

    render(
      <MemesSingleWaveDropInfoPanel
        drop={baseDrop}
        wave={null}
        isVotingControlsLocked={true}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("desktop-voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
    expect(screen.queryByText("Your votes:")).not.toBeInTheDocument();
  });

  it("hides Vote and keeps the mobile modal closed when voting is locked", () => {
    mockIsMobileScreen = true;
    mockUseDropInteractionRules.mockReturnValue({
      isWinner: false,
      canDelete: false,
      canShowVote: true,
      isVotingEnded: false,
    });

    render(
      <MemesSingleWaveDropInfoPanel
        drop={baseDrop}
        wave={null}
        isVotingControlsLocked={true}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("closes an open voting modal when voting becomes locked", () => {
    mockUseDropInteractionRules.mockReturnValue({
      isWinner: false,
      canDelete: false,
      canShowVote: true,
      isVotingEnded: false,
    });

    const { rerender } = render(
      <MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    expect(screen.getByTestId("desktop-voting-modal")).toHaveAttribute(
      "data-open",
      "true"
    );

    rerender(
      <MemesSingleWaveDropInfoPanel
        drop={baseDrop}
        wave={null}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.getByTestId("desktop-voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("hides outcome rows and disables reward fetch when outcomes are hidden", () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 12,
      repTotal: 3,
      manualOutcomes: ["Special prize"],
    });

    render(
      <MemesSingleWaveDropInfoPanel
        drop={baseDrop}
        wave={null}
        outcomesVisible={false}
      />
    );

    expect(mockUseWaveRankReward).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
    expect(screen.queryByText("Special prize")).toBeNull();
    expect(screen.queryByText("12 NIC")).toBeNull();
    expect(screen.queryByText("3 Rep")).toBeNull();
  });
});
