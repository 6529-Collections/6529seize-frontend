import { render } from '@testing-library/react';
import React from 'react';
import CommonCardSkeleton from '@/components/utils/animation/CommonCardSkeleton';

describe('CommonCardSkeleton', () => {
  it('renders skeleton with pulse animation class', () => {
    const { container } = render(<CommonCardSkeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('tw-animate-pulse');
  });
});
