/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Tweet } from "react-tweet/api";

import ExpandableTweetPreview from "@/components/tweets/ExpandableTweetPreview";
import { enrichTweet, useTweet } from "react-tweet";

jest.mock("react-tweet", () => ({
  TweetContainer: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="tweet-container">{children}</div>
  ),
  enrichTweet: jest.fn(),
  useTweet: jest.fn(),
}));

const mockUseTweet = useTweet as jest.MockedFunction<typeof useTweet>;
const mockEnrichTweet = enrichTweet as jest.MockedFunction<typeof enrichTweet>;

const createTweet = (overrides: Partial<Tweet> = {}): Tweet => ({
  __typename: "Tweet",
  id_str: "123",
  text: "hello world",
  created_at: "2026-05-25T00:00:00.000Z",
  lang: "en",
  display_text_range: [0, 11],
  entities: {
    hashtags: [],
    urls: [],
    user_mentions: [],
    symbols: [],
  },
  user: {
    id_str: "1",
    name: "6529",
    profile_image_url_https: "https://example.com/avatar.jpg",
    profile_image_shape: "Circle",
    screen_name: "6529",
    verified: false,
    is_blue_verified: false,
  },
  edit_control: {
    edit_tweet_ids: ["123"],
    editable_until_msecs: "0",
    is_edit_eligible: false,
    edits_remaining: "0",
  },
  isEdited: false,
  isStaleEdit: false,
  favorite_count: 0,
  conversation_count: 0,
  news_action_type: "conversation",
  ...overrides,
});

describe("ExpandableTweetPreview", () => {
  beforeEach(() => {
    mockUseTweet.mockReset();
    mockEnrichTweet.mockReset();
  });

  it("normalizes missing entity arrays before react-tweet enrichment", () => {
    const quotedTweet = {
      ...createTweet({ id_str: "456" }),
      reply_count: 0,
      retweet_count: 0,
      favorite_count: 0,
      self_thread: { id_str: "456" },
      entities: {
        hashtags: null,
        urls: undefined,
        user_mentions: [],
      },
    };
    const tweet = {
      ...createTweet(),
      entities: {
        hashtags: undefined,
        urls: [],
        user_mentions: null,
        symbols: undefined,
        media: null,
      },
      quoted_tweet: quotedTweet,
    } as unknown as Tweet;

    const href = "https://x.com/6529/status/123";
    mockUseTweet.mockReturnValue({
      data: tweet,
      isLoading: false,
      error: undefined,
    });
    mockEnrichTweet.mockReturnValue(null as never);

    render(
      <ExpandableTweetPreview
        href={href}
        tweetId="123"
        renderFallback={(fallbackHref) => (
          <a href={fallbackHref}>Open fallback tweet</a>
        )}
      />
    );

    const normalizedTweet = mockEnrichTweet.mock.calls[0]?.[0];

    expect(normalizedTweet?.entities).toEqual({
      hashtags: [],
      urls: [],
      user_mentions: [],
      symbols: [],
    });
    expect(normalizedTweet?.quoted_tweet?.entities).toEqual({
      hashtags: [],
      urls: [],
      user_mentions: [],
      symbols: [],
    });
  });

  it("renders the fallback when tweet enrichment throws", () => {
    const href = "https://x.com/6529/status/123";
    mockUseTweet.mockReturnValue({
      data: createTweet(),
      isLoading: false,
      error: undefined,
    });
    mockEnrichTweet.mockImplementation(() => {
      throw new Error("bad tweet payload");
    });

    render(
      <ExpandableTweetPreview
        href={href}
        tweetId="123"
        renderFallback={(fallbackHref) => (
          <a href={fallbackHref}>Open fallback tweet</a>
        )}
      />
    );

    expect(
      screen.getByRole("link", { name: "Open fallback tweet" })
    ).toHaveAttribute("href", href);
  });
});
