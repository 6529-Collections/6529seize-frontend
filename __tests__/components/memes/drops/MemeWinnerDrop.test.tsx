import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MemeWinnerDrop from "@/components/memes/drops/MemeWinnerDrop";

const mockMobileMenuClick = jest.fn();
const mockMemeDropVoteStats = jest.fn(
  ({ drop }: { readonly drop: { readonly raters_count: number } }) => (
    <button
      type="button"
      data-testid="winner-vote-details"
      aria-label={`View voters and vote log for ${drop.raters_count} ${
        drop.raters_count === 1 ? "voter" : "voters"
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      {drop.raters_count} voters
    </button>
  )
);
const mockUseDropActionInteractionMode = jest.fn(() => ({
  canUseDesktopHoverActions: true,
  canUseTouchActionSheet: false,
}));

jest.mock("@/hooks/useDropActionInteractionMode", () => ({
  __esModule: true,
  default: () => mockUseDropActionInteractionMode(),
}));
jest.mock("@/components/waves/drops/WaveDropActions", () => (props: any) => (
  <button data-testid="reply" onClick={() => props.onReply({})} />
));
jest.mock("@/components/memes/drops/MemeWinnerHeader", () => (props: any) => (
  <div>{props.title}</div>
));
jest.mock(
  "@/components/memes/drops/MemeWinnerDescription",
  () => (props: any) => <p>{props.description}</p>
);
jest.mock("@/components/memes/drops/MemeWinnerArtistInfo", () => () => (
  <div data-testid="artist" />
));
jest.mock("@/components/memes/drops/MemeDropTraits", () => () => (
  <div data-testid="traits" />
));
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
jest.mock(
  "@/components/waves/drops/DropMobileMenuHandler",
  () => (props: any) => (
    <div data-testid="mobile-menu-handler" onClick={mockMobileMenuClick}>
      {props.children}
    </div>
  )
);
jest.mock(
  "@/components/memes/drops/meme-participation-drop/MemeDropVoteStats",
  () => ({
    __esModule: true,
    default: (props: { readonly drop: { readonly raters_count: number } }) =>
      mockMemeDropVoteStats(props),
  })
);
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => (props: any) => <img data-testid="media" src={props.media_url} />
);

jest.mock("@/components/waves/drops/DropContext", () => ({
  useDropContext: () => ({ location: "WAVE" }),
}));

const drop: any = {
  parts: [{ part_id: 1, media: [{ url: "u", mime_type: "image/png" }] }],
  metadata: [],
  author: {},
  rating: 10,
  rating_prediction: 12,
  raters_count: 7,
  top_raters: [],
  wave: { voting_credit_type: "NIC" },
  context_profile_context: { rating: 2 },
};

beforeEach(() => {
  mockUseDropActionInteractionMode.mockReturnValue({
    canUseDesktopHoverActions: true,
    canUseTouchActionSheet: false,
  });
  mockMobileMenuClick.mockClear();
  mockMemeDropVoteStats.mockClear();
});

test("renders actions when desktop hover actions are active", () => {
  const onReply = jest.fn();
  render(
    <MemeWinnerDrop
      drop={drop}
      showReplyAndQuote
      onReply={onReply}
      onQuote={jest.fn()}
    />
  );
  expect(screen.getByTestId("identity")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("reply"));
  expect(onReply).toHaveBeenCalled();
});

test("keeps actions for desktop hover mode even when the user agent is mobile", () => {
  mockUseDropActionInteractionMode.mockReturnValue({
    canUseDesktopHoverActions: true,
    canUseTouchActionSheet: false,
  });

  render(
    <MemeWinnerDrop
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );

  expect(screen.getByTestId("reply")).toBeInTheDocument();
});

test("renders vote details through meme vote stats", () => {
  render(
    <MemeWinnerDrop
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );

  expect(mockMemeDropVoteStats).toHaveBeenCalledWith({ drop });
  expect(
    screen.getByRole("button", {
      name: "View voters and vote log for 7 voters",
    })
  ).toBeInTheDocument();
});

test("links a mapped Main Stage winner to its Meme card", () => {
  render(
    <MemeWinnerDrop
      drop={{ ...drop, submission_context: { meme_card_id: 521 } }}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );

  expect(screen.getByRole("link", { name: "Meme #521" })).toHaveAttribute(
    "href",
    "/the-memes/521"
  );
});

test("does not trigger the mobile menu wrapper when vote details is clicked", () => {
  render(
    <MemeWinnerDrop
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );

  const trigger = screen.getByTestId("winner-vote-details");

  expect(screen.getByTestId("mobile-menu-handler")).not.toContainElement(
    trigger
  );

  fireEvent.click(trigger);

  expect(mockMobileMenuClick).not.toHaveBeenCalled();
});

test("hides desktop actions when touch sheet mode is active", () => {
  mockUseDropActionInteractionMode.mockReturnValue({
    canUseDesktopHoverActions: false,
    canUseTouchActionSheet: true,
  });

  const { queryByTestId } = render(
    <MemeWinnerDrop
      drop={drop}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );
  expect(queryByTestId("reply")).toBeNull();
});

test("uses v2 title and part one content before metadata fallbacks", () => {
  render(
    <MemeWinnerDrop
      drop={{
        ...drop,
        title: "Part title",
        parts: [
          {
            part_id: 1,
            content: "Part description",
            media: [{ url: "u", mime_type: "image/png" }],
          },
        ],
        metadata: [
          { data_key: "title", data_value: "Metadata title" },
          { data_key: "description", data_value: "Metadata description" },
        ],
      }}
      showReplyAndQuote
      onReply={jest.fn()}
      onQuote={jest.fn()}
    />
  );

  expect(screen.getByText("Part title")).toBeInTheDocument();
  expect(screen.getByText("Part description")).toBeInTheDocument();
  expect(screen.queryByText("Metadata title")).not.toBeInTheDocument();
  expect(screen.queryByText("Metadata description")).not.toBeInTheDocument();
});
