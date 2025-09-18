import { fireEvent, render, screen } from "@testing-library/react";

import BlueskyCard from "../../../components/waves/BlueskyCard";

describe("BlueskyCard", () => {
  it("renders Bluesky posts with metadata", () => {
    render(
      <BlueskyCard
        href="https://bsky.app/profile/example.com/post/abc"
        preview={{
          type: "bluesky.post",
          canonicalUrl: "https://bsky.app/profile/example.com/post/abc",
          post: {
            uri: "at://did:plc:123/app.bsky.feed.post/abc",
            createdAt: "2024-01-01T00:00:00.000Z",
            text: "Hello Bluesky",
            author: {
              did: "did:plc:123",
              handle: "example.com",
              displayName: "Example",
              avatar: null,
            },
            counts: { replies: 1, reposts: 2, likes: 3 },
            inReplyTo: {
              uri: "https://bsky.app/profile/other/post/def",
              authorHandle: "other",
            },
            images: [
              {
                thumb:
                  "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:123/thumb@jpeg",
                fullsize:
                  "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:123/full@jpeg",
                alt: "Sample",
              },
            ],
            external: {
              uri: "https://example.com/article",
              title: "Example article",
              description: "An example link",
              thumb: null,
            },
            labels: ["nsfw"],
          },
        }}
      />
    );

    expect(screen.getByTestId("bluesky-post-card")).toBeInTheDocument();
    expect(screen.getByText("Hello Bluesky")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open post on Bluesky" })
    ).toHaveAttribute("href", "https://bsky.app/profile/example.com/post/abc");

    const revealButton = screen.getByRole("button", {
      name: /sensitive content/i,
    });
    fireEvent.click(revealButton);
    expect(
      screen.getByRole("button", { name: "Hide sensitive media" })
    ).toBeInTheDocument();
  });

  it("renders Bluesky profiles", () => {
    render(
      <BlueskyCard
        href="https://bsky.app/profile/example.com"
        preview={{
          type: "bluesky.profile",
          canonicalUrl: "https://bsky.app/profile/example.com",
          profile: {
            did: "did:plc:123",
            handle: "example.com",
            displayName: "Example",
            avatar: null,
            banner: null,
            description: "Example bio",
            counts: { followers: 10, follows: 5, posts: 1 },
          },
        }}
      />
    );

    expect(screen.getByTestId("bluesky-profile-card")).toBeInTheDocument();
    expect(screen.getByText("Example bio")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open profile on Bluesky" })
    ).toHaveAttribute("href", "https://bsky.app/profile/example.com");
  });

  it("renders Bluesky feed generators", () => {
    render(
      <BlueskyCard
        href="https://bsky.app/profile/example.com/feed/abc"
        preview={{
          type: "bluesky.feed",
          canonicalUrl: "https://bsky.app/profile/example.com/feed/abc",
          feed: {
            uri: "at://did:plc:123/app.bsky.feed.generator/abc",
            displayName: "Discover",
            description: "Trending content",
            avatar: null,
            creator: {
              did: "did:plc:123",
              handle: "example.com",
              displayName: "Example",
              avatar: null,
            },
          },
        }}
      />
    );

    expect(screen.getByTestId("bluesky-feed-card")).toBeInTheDocument();
    expect(screen.getByText("Trending content")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open feed on Bluesky" })
    ).toHaveAttribute("href", "https://bsky.app/profile/example.com/feed/abc");
  });

  it("renders unavailable cards", () => {
    render(
      <BlueskyCard
        href="https://bsky.app/profile/example.com/post/abc"
        preview={{
          type: "bluesky.unavailable",
          canonicalUrl: "https://bsky.app/profile/example.com/post/abc",
          targetKind: "post",
        }}
      />
    );

    expect(screen.getByTestId("bluesky-unavailable-card")).toBeInTheDocument();
    expect(screen.getByText(/unavailable on Bluesky/i)).toBeInTheDocument();
  });
});
