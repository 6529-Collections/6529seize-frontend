import MyStreamWaveMyVote from "@/components/brain/my-stream/votes/MyStreamWaveMyVote";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockMediaDisplay = jest.fn();
const mockIsCurationWave = jest.fn(() => false);

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: (props: any) => {
    mockMediaDisplay(props);
    return <div data-testid="media" />;
  },
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVoteVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="votes" />,
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="input" data-vote-controls>
      <input aria-label="Your votes" />
      <span>TDH</span>
      <button type="button">Vote</button>
      <button type="button">Explain</button>
      <button type="button" disabled>
        <span>Disabled vote</span>
      </button>
    </div>
  ),
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
  UserCICAndLevelSize: { SMALL: "SMALL" },
}));

jest.mock("@/components/waves/drop/SingleWaveDropPosition", () => ({
  __esModule: true,
  SingleWaveDropPosition: ({ rank }: any) => (
    <div data-testid="pos">{rank}</div>
  ),
  default: ({ rank }: any) => <div data-testid="pos">{rank}</div>,
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isCurationWave: mockIsCurationWave,
  }),
}));

describe("MyStreamWaveMyVote", () => {
  const drop: any = {
    id: "d1",
    title: "Drop Title",
    parts: [{ media: [{ url: "a", mime_type: "image/jpeg" }] }],
    metadata: [],
    wave: { id: "w1" },
    nft_links: [],
    top_raters: [],
    author: { handle: "alice", cic: 1, level: 2 },
    rating: 0,
    raters_count: 3,
  };

  beforeEach(() => {
    mockMediaDisplay.mockClear();
    mockIsCurationWave.mockReset();
    mockIsCurationWave.mockReturnValue(false);
    (globalThis.getSelection as any) = () => ({ toString: () => "" });
  });

  it.each(["row", "total", "voters"] as const)(
    "toggles reset selection once without opening the submission when clicking the %s",
    (target) => {
      const onDropClick = jest.fn();
      const onToggleCheck = jest.fn();
      const { rerender } = render(
        <MyStreamWaveMyVote
          drop={drop}
          onDropClick={onDropClick}
          onToggleCheck={onToggleCheck}
        />
      );
      const targets = {
        row: screen.getByRole("article", { name: "Drop Title" }),
        total: screen.getByTestId("votes"),
        voters: screen.getByText("3"),
      };

      fireEvent.click(targets[target]);

      expect(onToggleCheck).toHaveBeenCalledTimes(1);
      expect(onToggleCheck).toHaveBeenCalledWith("d1");
      expect(onDropClick).not.toHaveBeenCalled();

      rerender(
        <MyStreamWaveMyVote
          drop={drop}
          onDropClick={onDropClick}
          onToggleCheck={onToggleCheck}
          isChecked
        />
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
      fireEvent.click(targets[target]);
      expect(onToggleCheck).toHaveBeenCalledTimes(2);
      expect(onDropClick).not.toHaveBeenCalled();
    }
  );

  it("does not toggle or open the row when text is selected", () => {
    const onDropClick = jest.fn();
    const onToggleCheck = jest.fn();
    (globalThis.getSelection as any) = () => ({ toString: () => "selected" });
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );

    fireEvent.click(screen.getByRole("article", { name: "Drop Title" }));

    expect(onDropClick).not.toHaveBeenCalled();
    expect(onToggleCheck).not.toHaveBeenCalled();
  });

  it.each(["Open Drop Title", "Drop Title"])(
    "opens with Enter on the native %s button without a nested row link",
    async (buttonName) => {
      const user = userEvent.setup();
      const onDropClick = jest.fn();
      const onToggleCheck = jest.fn();
      render(
        <MyStreamWaveMyVote
          drop={drop}
          onDropClick={onDropClick}
          onToggleCheck={onToggleCheck}
        />
      );
      const row = screen.getByRole("article", { name: "Drop Title" });
      expect(row).not.toHaveAttribute("tabindex");
      expect(
        screen.queryByRole("link", { name: "Open Drop Title" })
      ).not.toBeInTheDocument();
      screen.getByRole("button", { name: buttonName }).focus();

      await user.keyboard("{Enter}");

      expect(onDropClick).toHaveBeenCalledTimes(1);
      expect(onDropClick).toHaveBeenCalledWith(drop);
      expect(onToggleCheck).not.toHaveBeenCalled();
    }
  );

  it("keeps vote controls and their surrounding area separate from row selection", () => {
    const onDropClick = jest.fn();
    const onToggleCheck = jest.fn();
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );

    fireEvent.click(screen.getByTestId("input"));
    fireEvent.click(screen.getByText("TDH"));
    fireEvent.click(screen.getByRole("textbox", { name: "Your votes" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Your votes" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    fireEvent.click(screen.getByRole("button", { name: "Explain" }));
    fireEvent.click(screen.getByText("Disabled vote"));

    expect(onDropClick).not.toHaveBeenCalled();
    expect(onToggleCheck).not.toHaveBeenCalled();
  });

  it("keeps the profile link separate from submission navigation", () => {
    const onDropClick = jest.fn();
    const onToggleCheck = jest.fn();
    const openProfile = jest.spyOn(window, "open").mockReturnValue(null);
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: "alice" }));

    expect(openProfile).toHaveBeenCalledWith("/alice", "_blank");
    expect(onDropClick).not.toHaveBeenCalled();
    expect(onToggleCheck).not.toHaveBeenCalled();
    openProfile.mockRestore();
  });

  it("keeps the media tooltip separate from submission navigation", () => {
    const onDropClick = jest.fn();
    const onToggleCheck = jest.fn();
    const { container } = render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );
    const mediaBadge = container.querySelector(
      '[data-tooltip-id="format-badge-d1"]'
    );

    expect(mediaBadge).toHaveAttribute("tabindex", "0");
    fireEvent.click(mediaBadge!);
    fireEvent.keyDown(mediaBadge!, { key: "Enter" });

    expect(onDropClick).not.toHaveBeenCalled();
    expect(onToggleCheck).not.toHaveBeenCalled();
  });

  it.each(["Open Drop Title", "Drop Title"])(
    "triggers onDropClick from %s when no text is selected",
    (buttonName) => {
      const onDropClick = jest.fn();
      const onToggleCheck = jest.fn();
      (globalThis.getSelection as any) = () => ({ toString: () => "" });
      render(
        <MyStreamWaveMyVote
          drop={drop}
          onDropClick={onDropClick}
          onToggleCheck={onToggleCheck}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: buttonName }));
      expect(onDropClick).toHaveBeenCalledTimes(1);
      expect(onDropClick).toHaveBeenCalledWith(drop);
      expect(onToggleCheck).not.toHaveBeenCalled();
    }
  );

  it.each(["Open Drop Title", "Drop Title"])(
    "does not trigger onDropClick from %s when text is selected",
    (buttonName) => {
      const onDropClick = jest.fn();
      (globalThis.getSelection as any) = () => ({ toString: () => "sel" });
      render(
        <MyStreamWaveMyVote drop={drop} onDropClick={onDropClick} />
      );
      fireEvent.click(screen.getByRole("button", { name: buttonName }));
      expect(onDropClick).not.toHaveBeenCalled();
    }
  );

  it("calls onToggleCheck when checkbox clicked", () => {
    const onToggleCheck = jest.fn();
    const onDropClick = jest.fn();
    (globalThis.getSelection as any) = () => ({ toString: () => "" });
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        isChecked={false}
        onToggleCheck={onToggleCheck}
      />
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Select Drop Title for vote reset",
    });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggleCheck).toHaveBeenCalledTimes(1);
    expect(onToggleCheck).toHaveBeenCalledWith("d1");
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("toggles reset selection once with Space on the native checkbox", async () => {
    const user = userEvent.setup();
    const onToggleCheck = jest.fn();
    const onDropClick = jest.fn();
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );
    screen.getByRole("checkbox").focus();

    await user.keyboard(" ");

    expect(onToggleCheck).toHaveBeenCalledTimes(1);
    expect(onToggleCheck).toHaveBeenCalledWith("d1");
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it.each(["isResetting", "isVotingClosed"] as const)(
    "blocks row selection while %s but keeps title and artwork navigation",
    (disabledProp) => {
      const onToggleCheck = jest.fn();
      const onDropClick = jest.fn();
      render(
        <MyStreamWaveMyVote
          drop={drop}
          onDropClick={onDropClick}
          onToggleCheck={onToggleCheck}
          {...{ [disabledProp]: true }}
        />
      );

      fireEvent.click(screen.getByRole("article", { name: "Drop Title" }));
      const checkbox = screen.queryByRole("checkbox");
      if (checkbox) {
        expect(checkbox).toBeDisabled();
        fireEvent.click(checkbox);
      }
      expect(onToggleCheck).not.toHaveBeenCalled();
      expect(onDropClick).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Drop Title" }));
      fireEvent.click(screen.getByRole("button", { name: "Open Drop Title" }));
      expect(onDropClick).toHaveBeenCalledTimes(2);
      expect(onToggleCheck).not.toHaveBeenCalled();
    }
  );

  it("keeps the checkbox label click separate from submission navigation", () => {
    const onDropClick = jest.fn();
    const onToggleCheck = jest.fn();
    render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={onDropClick}
        onToggleCheck={onToggleCheck}
      />
    );

    fireEvent.click(screen.getByText("Select Drop Title for vote reset"));

    expect(onToggleCheck).toHaveBeenCalledTimes(1);
    expect(onToggleCheck).toHaveBeenCalledWith("d1");
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("hides vote controls when voting is closed", () => {
    const { container } = render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={jest.fn()}
        isChecked={true}
        isVotingClosed={true}
        onToggleCheck={jest.fn()}
      />
    );

    expect(screen.getByTestId("votes")).toBeInTheDocument();
    expect(screen.queryByTestId("input")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveClass(
      "tw-border-primary-400/70"
    );
  });

  it("uses curation nft preview media when drop has no attached media", () => {
    mockIsCurationWave.mockReturnValue(true);
    const curationDrop = {
      ...drop,
      wave: { id: "W1" },
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "READY",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(<MyStreamWaveMyVote drop={curationDrop} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("media")).toBeInTheDocument();
    expect(mockIsCurationWave).toHaveBeenCalledWith("w1");
    const props = mockMediaDisplay.mock.calls.at(-1)?.[0];
    expect(props?.media_url).toBe("https://cdn.example.com/card.webp");
    expect(props?.media_mime_type).toBe("image/webp");
  });

  it("falls back to media_uri when preview status is not ready", () => {
    mockIsCurationWave.mockReturnValue(true);
    const curationDrop = {
      ...drop,
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "PROCESSING",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(<MyStreamWaveMyVote drop={curationDrop} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("media")).toBeInTheDocument();
    const props = mockMediaDisplay.mock.calls.at(-1)?.[0];
    expect(props?.media_url).toBe("https://cdn.example.com/fallback.png");
    expect(props?.media_mime_type).toBe("image/png");
  });

  it("does not use nft preview media outside curation waves", () => {
    mockIsCurationWave.mockReturnValue(false);
    const nonCurationDrop = {
      ...drop,
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "READY",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(
      <MyStreamWaveMyVote drop={nonCurationDrop} onDropClick={jest.fn()} />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(mockMediaDisplay).not.toHaveBeenCalled();
  });
});
