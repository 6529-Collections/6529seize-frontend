import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../components/react-query-wrapper/ReactQueryWrapper';
import { getCommonHeaders, getUserProfileActivityLogs } from '../../../helpers/server.helpers';

jest.mock('../../../components/utils/sidebar/SidebarLayout', () => ({ children }: any) => <div data-testid="layout">{children}</div>);
jest.mock('../../../components/profile-activity/ProfileActivityLogs', () => ({ children, ...props }: any) => { global.__profileProps = props; return <div data-testid="logs">{children}</div>; });

jest.mock('../../../helpers/server.helpers');

// Import after mocks so side effects run with mocks applied
import CommunityActivityPage, { getServerSideProps } from '../../../pages/network/activity';

const mockedGetCommonHeaders = getCommonHeaders as jest.Mock;
const mockedGetLogs = getUserProfileActivityLogs as jest.Mock;

describe('CommunityActivityPage', () => {
  function renderPage() {
    const setTitle = jest.fn();
    const initCommunityActivityPage = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <ReactQueryWrapperContext.Provider value={{ initCommunityActivityPage } as any}>
          <CommunityActivityPage pageProps={{ logsPage: { items: [] } } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    return { setTitle, initCommunityActivityPage };
  }

  it('initializes page and sets title', () => {
    const { setTitle, initCommunityActivityPage } = renderPage();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Activity | Network' });
    expect(initCommunityActivityPage).toHaveBeenCalledWith({
      activityLogs: { data: { items: [] }, params: expect.any(Object) },
    });
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('logs')).toBeInTheDocument();
    expect(global.__profileProps.initialParams.page).toBe(1);
  });

  it('exports metadata', () => {
    expect(CommunityActivityPage.metadata).toEqual({ title: 'Activity', description: 'Network' });
  });
});

describe('getServerSideProps', () => {
  it('returns logs on success', async () => {
    mockedGetCommonHeaders.mockReturnValue({ h: 1 });
    mockedGetLogs.mockResolvedValue('data');
    const result = await getServerSideProps({} as any, {} as any, '/a');
    expect(mockedGetCommonHeaders).toHaveBeenCalled();
    expect(mockedGetLogs).toHaveBeenCalled();
    expect(result).toEqual({ props: { logsPage: 'data' } });
  });

  it('redirects on error', async () => {
    mockedGetLogs.mockRejectedValue(new Error('err'));
    const result = await getServerSideProps({} as any, {} as any, '/a');
    expect(result).toEqual({ redirect: { permanent: false, destination: '/404' }, props: {} });
  });
});
