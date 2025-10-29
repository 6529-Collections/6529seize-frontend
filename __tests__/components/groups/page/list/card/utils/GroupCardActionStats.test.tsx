import { render, screen } from '@testing-library/react';
import React from 'react';
import GroupCardActionStats from '@/components/groups/page/list/card/utils/GroupCardActionStats';
import { AuthContext } from '@/components/auth/Auth';
import { useQuery } from '@tanstack/react-query';
import { ApiRateMatter } from '@/generated/models/ApiRateMatter';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: 'SMALL' }
}));

const useQueryMock = useQuery as jest.Mock;

const authValue = { connectedProfile: { handle: 'alice' }, activeProfileProxy: null } as any;

describe('GroupCardActionStats', () => {
  it('calculates credit per member', () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 } });
    render(
      <AuthContext.Provider value={authValue}>
        <GroupCardActionStats matter={ApiRateMatter.Rep} membersCount={2} loadingMembersCount={false} />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/\+-5/)).toBeInTheDocument();
  });

  it('shows loader when member count loading', () => {
    useQueryMock.mockReturnValue({ data: { rep_credit: 10 } });
    render(
      <AuthContext.Provider value={authValue}>
        <GroupCardActionStats matter={ApiRateMatter.Rep} membersCount={null} loadingMembersCount={true} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
