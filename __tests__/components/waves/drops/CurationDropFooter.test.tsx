import CurationDropFooter from "@/components/waves/drops/CurationDropFooter";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/waves/drops/WaveDropActionsAddReaction",
  () => () => null
);
jest.mock("@/components/waves/drops/WaveDropActionsCopyLink", () => () => null);
jest.mock("@/components/waves/drops/WaveDropReactions", () => () => (
  <div data-testid="reactions" />
));

it("preserves the reaction view while the last chip disappears and returns", () => {
  const drop = {
    id: "drop-1",
    reactions: [
      { reaction: ":wave:", profiles: [{ id: "viewer", handle: "viewer" }] },
    ],
  } as unknown as ExtendedDrop;
  const { rerender } = render(<CurationDropFooter drop={drop} />);
  const view = screen.getByTestId("reactions");
  expect(view).toBeVisible();
  rerender(<CurationDropFooter drop={{ ...drop, reactions: [] }} />);
  expect(screen.getByTestId("reactions")).toBe(view);
  expect(view).not.toBeVisible();
  rerender(<CurationDropFooter drop={drop} />);
  expect(screen.getByTestId("reactions")).toBe(view);
  expect(view).toBeVisible();
});
