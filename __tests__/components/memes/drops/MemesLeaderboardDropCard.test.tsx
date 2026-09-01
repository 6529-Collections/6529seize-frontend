import { render } from "@testing-library/react";
import React from "react";
import MemesLeaderboardDropCard from "@/components/memes/drops/MemesLeaderboardDropCard";

test("applies the leaderboard card border treatment", () => {
  const { container } = render(
    <MemesLeaderboardDropCard>content</MemesLeaderboardDropCard>
  );
  const innerDiv = container.firstChild?.firstChild as HTMLElement;
  expect(innerDiv).toHaveClass("tw-border-iron-900");
  expect(innerDiv).toHaveClass("desktop-hover:hover:tw-border-white/10");
});
