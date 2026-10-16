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
  const links = screen.getAllByRole("link", { name: "@artistB" });
  expect(links).toHaveLength(1);
  expect(authorRow).not.toContainElement(links[0]);
});
