import { render } from '@testing-library/react';
import React from 'react';
import CommonSkeletonLoader from '@/components/utils/animation/CommonSkeletonLoader';

describe('CommonSkeletonLoader', () => {
  it('renders loader with pulse animation class', () => {
    const { container } = render(<CommonSkeletonLoader />);
    const div = container.firstElementChild as HTMLElement;
    expect(div).toHaveClass('tw-animate-pulse');
  });
});
