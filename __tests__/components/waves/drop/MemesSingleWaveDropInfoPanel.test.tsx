import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemesDropFullscreenOverlay } from "@/components/waves/drop/MemesDropFullscreenOverlay";
import { MemesSingleWaveDropInfoPanel } from "@/components/waves/drop/MemesSingleWaveDropInfoPanel";
import { ApiDropType } from "@/generated/models/ApiDropType";

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
jest.mock("@/components/waves/drop/SingleWaveDropInfoActions", () => ({
  SingleWaveDropInfoActions: () => <div data-testid="actions" />,
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
jest.mock("@/components/waves/memes/submission/MemesArtResubmitAction", () => ({
  MemesArtResubmitAction: (p: any) => (
    <button data-testid="resubmit" onClick={p.onSourceDropDeleted}>
      resubmit
    </button>
  ),
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => (props: any) => (
    <div
      data-testid="media"
      data-disable-modal={String(props.disableModal)}
      data-media-mime-type={props.media_mime_type}
      data-media-url={props.media_url}
    />
  )
);
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(() => ({
    isWinner: true,
    canDelete: true,
    canShowVote: false,
    isVotingEnded: true,
  })),
}));
jest.mock("@/hooks/waves/useWaveRankReward", () => ({
  useWaveRankReward: jest.fn(() => ({
    nicTotal: 0,
    repTotal: 0,
    manualOutcomes: [],
  })),
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
  it("renders drop info and delete button", () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-url",
      "img.png"
    );
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-disable-modal",
      "true"
    );
    expect(screen.getByTestId("traits")).toBeInTheDocument();
    expect(screen.getByTestId("process")).toBeInTheDocument();
    expect(screen.getByTestId("author")).toBeInTheDocument();
    expect(screen.getByTestId("details")).toBeInTheDocument();
    expect(screen.getByTestId("delete")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
  });

  it("opens fullscreen when the hero fullscreen button is clicked", async () => {
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);

    expect(
      screen.queryByRole("button", { name: "Exit fullscreen view" })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Open fullscreen view" })
    );

    expect(
      screen.getByRole("button", { name: "Exit fullscreen view" })
    ).toBeInTheDocument();
  });

  it.each([
    ["video/mp4", "video.mp4"],
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
      screen.queryByRole("button", { name: "Open fullscreen view" })
    ).not.toBeInTheDocument();
  });

  it("closes fullscreen when button clicked", async () => {
    const setState = jest.fn();
    const spy = jest
      .spyOn(React, "useState")
      .mockImplementationOnce(() => [true, setState]);
    render(<MemesSingleWaveDropInfoPanel drop={baseDrop} wave={null} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Exit fullscreen view" })
    );
    expect(setState).toHaveBeenCalledWith(false);
    spy.mockRestore();
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
});

describe("MemesDropFullscreenOverlay", () => {
  const artworkMedia = baseDrop.parts[0].media[0];

  it("closes when Escape is pressed", () => {
    const onClose = jest.fn();

    render(
      <MemesDropFullscreenOverlay
        isOpen={true}
        artworkMedia={artworkMedia}
        drop={baseDrop}
        title="Title"
        description="Desc"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("passes null rank through to the position badge for unranked drops", () => {
    render(
      <MemesDropFullscreenOverlay
        isOpen={true}
        artworkMedia={artworkMedia}
        drop={{ ...baseDrop, rank: null }}
        title="Title"
        description="Desc"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("position")).toHaveAttribute("data-rank", "null");
  });

  it("prevents Escape from closing the parent drop modal", () => {
    const onClose = jest.fn();
    const parentDropModalClose = jest.fn();

    document.addEventListener("keydown", parentDropModalClose);

    try {
      render(
        <MemesDropFullscreenOverlay
          isOpen={true}
          artworkMedia={artworkMedia}
          drop={baseDrop}
          title="Title"
          description="Desc"
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(parentDropModalClose).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener("keydown", parentDropModalClose);
    }
  });

  it("closes only when the backdrop is clicked", () => {
    const onClose = jest.fn();

    render(
      <MemesDropFullscreenOverlay
        isOpen={true}
        artworkMedia={artworkMedia}
        drop={baseDrop}
        title="Title"
        description="Desc"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByAltText("Title"));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Title" });
    const backdrop = dialog.parentElement;
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the previously focused element when closed", async () => {
    const user = userEvent.setup();

    function OverlayHarness() {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open fullscreen
          </button>
          <MemesDropFullscreenOverlay
            isOpen={isOpen}
            artworkMedia={artworkMedia}
            drop={baseDrop}
            title="Title"
            description="Desc"
            onClose={() => setIsOpen(false)}
          />
        </>
      );
    }

    render(<OverlayHarness />);

    const trigger = screen.getByRole("button", { name: "Open fullscreen" });
    await user.click(trigger);

    const closeButton = screen.getByRole("button", {
      name: "Exit fullscreen view",
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.click(closeButton);

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("does not render when closed or media is missing", () => {
    const { rerender } = render(
      <MemesDropFullscreenOverlay
        isOpen={false}
        artworkMedia={artworkMedia}
        drop={baseDrop}
        title="Title"
        description="Desc"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Exit fullscreen view" })
    ).not.toBeInTheDocument();

    rerender(
      <MemesDropFullscreenOverlay
        isOpen={true}
        artworkMedia={null}
        drop={baseDrop}
        title="Title"
        description="Desc"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Exit fullscreen view" })
    ).not.toBeInTheDocument();
  });

  it.each(["video/mp4", "text/html", "model/gltf-binary"])(
    "does not render image-only overlay for %s media",
    (mime_type) => {
      render(
        <MemesDropFullscreenOverlay
          isOpen={true}
          artworkMedia={{ mime_type, url: "media" }}
          drop={baseDrop}
          title="Title"
          description="Desc"
          onClose={jest.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Exit fullscreen view" })
      ).not.toBeInTheDocument();
    }
  );
});
