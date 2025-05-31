import React from 'react';
import { render, screen } from '@testing-library/react';
import CommunityPage from '../../../pages/network/index';
import { AuthContext } from '../../../components/auth/Auth';
import { useSelector } from 'react-redux';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { QueryKey } from '../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../../components/utils/sidebar/SidebarLayout', () => ({ children }: any) => <div data-testid="layout">{children}</div>);
jest.mock('../../../components/community/CommunityMembers', () => () => <div data-testid="members" />);

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData: 'keepPreviousData' }));
jest.mock('../../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

describe('CommunityPage', () => {
  const useQueryMock = useQuery as jest.Mock;
  const useSelectorMock = useSelector as jest.Mock;

  function renderComponent() {
    const setTitle = jest.fn();
    return {
      setTitle,
      ...render(
        <AuthContext.Provider value={{ setTitle } as any}>
          <CommunityPage />
        </AuthContext.Provider>
      ),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets title and fetches group data', () => {
    useSelectorMock.mockReturnValue('g1');
    useQueryMock.mockReturnValue({});

    const { setTitle } = renderComponent();

    expect(setTitle).toHaveBeenCalledWith({ title: 'Network' });
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QueryKey.GROUP, 'g1'],
        placeholderData: keepPreviousData,
        enabled: true,
      })
    );
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('members')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(CommunityPage.metadata).toEqual({
      title: 'Network',
      description: 'Network',
      twitterCard: 'summary_large_image',
    });
  });
});
