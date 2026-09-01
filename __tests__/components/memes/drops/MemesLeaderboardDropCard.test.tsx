import { render } from "@testing-library/react";
import React from "react";
import MemesLeaderboardDropCard from "@/components/memes/drops/MemesLeaderboardDropCard";

test.each([1, 2, 3, 4])("applies the same border treatment for rank %i", (rank) => {
  const drop = { rank } as any;
  const { container } = render(
    <MemesLeaderboardDropCard drop={drop}>content</MemesLeaderboardDropCard>
  );
  const innerDiv = container.firstChild?.firstChild as HTMLElement;
  expect(innerDiv).toHaveClass("tw-border-iron-900");
  expect(innerDiv).toHaveClass("desktop-hover:hover:tw-border-white/10");
});
