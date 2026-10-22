import { render, screen } from "@testing-library/react";
import { WaveDropMetaRow } from "@/components/waves/drop/WaveDropMetaRow";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";

jest.mock("@/components/waves/drop/SingleWaveDropAuthor", () => ({
  SingleWaveDropAuthor: () => <span>Author</span>,
}));
jest.mock("@/components/waves/drops/time/WaveDropTime", () => () => (
  <span>Time</span>
));
jest.mock("@/components/waves/drop/WinnerBadge", () => ({
  WinnerBadge: () => null,
}));
jest.mock("@/components/waves/drop/SingleWaveDropPosition", () => ({
  SingleWaveDropPosition: () => null,
}));
jest.mock("@/components/drops/media/MediaTypeBadge", () => () => null);
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("keeps the author and timestamp on one row and credits collaborators once below it", () => {
  render(
    <WaveDropMetaRow
      isWinner={false}
      drop={
        {
          drop_type: ApiDropType.Chat,
          created_at: 1,
          collaborators: [
            { id: "B", handle: "artistB", display: "artistB", pfp: null },
          ],
        } as ExtendedDrop
      }
    />
  );
  const authorRow = screen.getByText("Author").parentElement;
  expect(authorRow).toContainElement(screen.getByText("Time"));
  const collaborator = screen.getByRole("link", { name: "artistB" });
  expect(authorRow).not.toContainElement(collaborator);
});

// Profile fetching and badge rendering have dedicated collaborator identity coverage.
jest.mock(
  "@/components/waves/memes/collaborations/MemeCollaboratorIdentity",
  () => ({
    MemeCollaboratorIdentity: ({
      collaborator,
    }: {
      collaborator: { handle: string };
    }) => <a href={`/${collaborator.handle}`}>{collaborator.handle}</a>,
  })
);
