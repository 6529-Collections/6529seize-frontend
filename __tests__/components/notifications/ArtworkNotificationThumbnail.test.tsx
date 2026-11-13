import { fireEvent, render, screen } from "@testing-library/react";
import ArtworkNotificationThumbnail from "@/components/notifications/ArtworkNotificationThumbnail";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { INotificationArtistArtwork } from "@/types/feed.types";

const imageUrl = "https://d3lqz0a4bldqgf.cloudfront.net/drops/artwork.png";
const drop = {
  id: "artwork",
  metadata: [],
  parts: [{ media: [{ url: imageUrl, mime_type: "image/png" }] }],
} as unknown as ApiDrop;
const notification = {
  cause: ApiNotificationCause.ArtistArtworkSubmitted,
  related_drops: [drop],
  additional_context: { drop_id: drop.id },
} as INotificationArtistArtwork;

it("uses a small rendition of the matching artwork with decorative alt text", () => {
  render(
    <ArtworkNotificationThumbnail
      notification={{
        ...notification,
        related_drops: [{ ...drop, id: "other", parts: [] }, drop],
      }}
    />
  );
  expect(screen.getByRole("presentation")).toHaveAttribute(
    "src",
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/AUTOx50/artwork.png"
  );
  expect(screen.getByRole("presentation")).toHaveAttribute("loading", "lazy");
});

it("uses the artist's preview image for video artwork without loading the video", () => {
  render(
    <ArtworkNotificationThumbnail
      notification={{
        ...notification,
        related_drops: [
          {
            ...drop,
            parts: [
              {
                ...drop.parts[0]!,
                media: [
                  {
                    url: "https://example.com/art.mp4",
                    mime_type: "video/mp4",
                  },
                ],
              },
            ],
            metadata: [
              {
                data_key: "additional_media",
                data_value: JSON.stringify({ preview_image: imageUrl }),
              },
            ],
          },
        ],
      }}
    />
  );
  expect(screen.getByRole("presentation")).toHaveAttribute(
    "src",
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/AUTOx50/artwork.png"
  );
});

it.each(
  [
    [],
    [{ ...drop, parts: [] }],
    [{ ...drop, id: "unrelated" }],
    [
      {
        ...drop,
        parts: [
          {
            media: [
              { url: "https://example.com/art.mp4", mime_type: "video/mp4" },
            ],
          },
        ],
      },
    ],
  ].map((drops) => ({ drops }))
)("keeps the fallback when there is no artwork image (%j)", ({ drops }) => {
  const { container } = render(
    <ArtworkNotificationThumbnail
      notification={{ ...notification, related_drops: drops as ApiDrop[] }}
    />
  );
  expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

it("falls back after an image error and can show a different artwork afterwards", () => {
  const { container, rerender } = render(
    <ArtworkNotificationThumbnail notification={notification} />
  );
  fireEvent.error(screen.getByRole("presentation"));
  expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  expect(container.querySelector("svg")).toBeInTheDocument();
  rerender(
    <ArtworkNotificationThumbnail
      notification={{
        ...notification,
        related_drops: [
          {
            ...drop,
            parts: [
              {
                ...drop.parts[0]!,
                media: [
                  {
                    url: "https://example.com/new.png",
                    mime_type: "image/png",
                  },
                ],
              },
            ],
          },
        ],
      }}
    />
  );
  expect(screen.getByRole("presentation")).toHaveAttribute(
    "src",
    "https://example.com/new.png"
  );
});
