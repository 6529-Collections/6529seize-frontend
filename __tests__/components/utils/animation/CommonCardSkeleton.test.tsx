import { render } from '@testing-library/react';
import React from 'react';
import CommonCardSkeleton from '../../../../components/utils/animation/CommonCardSkeleton';

describe('CommonCardSkeleton', () => {
  it('renders skeleton with pulse class', () => {
    const { container } = render(<CommonCardSkeleton />);
    const div = container.firstElementChild as HTMLElement;
    expect(div).toHaveClass('tw-animate-pulse');
  });
});
