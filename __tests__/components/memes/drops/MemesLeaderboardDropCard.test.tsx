import { render } from '@testing-library/react';
import React from 'react';
import MemesLeaderboardDropCard from '../../../../components/memes/drops/MemesLeaderboardDropCard';

test.each([
  [1, 'desktop-hover:hover:tw-border-[#fbbf24]/40'],
  [2, 'desktop-hover:hover:tw-border-[#94a3b8]/40'],
  [3, 'desktop-hover:hover:tw-border-[#CD7F32]/40'],
  [4, 'desktop-hover:hover:tw-border-iron-700'],
])('applies border class for rank %i', (rank, expected) => {
  const drop = { rank } as any;
  const { container } = render(
    <MemesLeaderboardDropCard drop={drop}>content</MemesLeaderboardDropCard>
  );
  // Get the inner div that contains the border classes
  const innerDiv = container.firstChild?.firstChild as HTMLElement;
  expect(innerDiv?.className).toContain(expected);
});
