import { render, screen } from '@testing-library/react';
import React from 'react';
import UserPageCollectedFirstLoading from '@/components/user/collected/UserPageCollectedFirstLoading';

jest.mock('@/components/utils/animation/CommonSkeletonLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));
jest.mock('@/components/utils/animation/CommonCardSkeleton', () => ({ __esModule: true, default: () => <div data-testid="card" /> }));

describe('UserPageCollectedFirstLoading', () => {
  it('renders skeleton loaders and cards', () => {
    render(<UserPageCollectedFirstLoading />);
    expect(screen.getAllByTestId('loader')).toHaveLength(2);
    expect(screen.getAllByTestId('card')).toHaveLength(20);
  });
});
