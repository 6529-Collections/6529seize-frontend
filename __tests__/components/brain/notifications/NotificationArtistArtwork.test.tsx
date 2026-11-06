import { render, screen } from "@testing-library/react";
import NotificationArtistArtwork from "@/components/brain/notifications/NotificationArtistArtwork";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { INotificationArtistArtwork } from "@/types/feed.types";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({ __esModule: true, default: () => null })
);

it.each([
  { handle: "artist", isAnonymous: false, expected: "artist" },
  { handle: null, isAnonymous: false, expected: "Unknown profile" },
  { handle: "hidden-artist", isAnonymous: true, expected: "Anonymous" },
])("renders the artist as $expected", ({ handle, isAnonymous, expected }) => {
  const notification: INotificationArtistArtwork = {
    id: 1,
    created_at: 1,
    read_at: null,
    cause: ApiNotificationCause.ArtistArtworkSubmitted,
    related_identity: {
      id: "artist-id",
      handle,
      is_anonymous: isAnonymous,
    } as ApiProfileMin,
    related_drops: [],
    additional_context: {
      artist_id: "artist-id",
      drop_id: "drop/1",
      wave_id: "wave/1",
      competition_id: "competition/1",
      entry_id: "entry/1",
      competition_title: "The Memes Main Stage",
      artwork_title: "Test artwork",
      submitted_at: 1,
    },
  };
  const { container } = render(
    <NotificationArtistArtwork notification={notification} />
  );
  expect(container).toHaveTextContent(`${expected} submitted`);
  expect(container).not.toHaveTextContent("hidden-artist");
  expect(screen.getByRole("link", { name: "Test artwork" })).toHaveAttribute(
    "href",
    "/waves/wave%2F1/competitions/competition%2F1?drop=drop%2F1"
  );
});
