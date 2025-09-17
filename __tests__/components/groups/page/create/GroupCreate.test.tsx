import React from 'react';
import { render, act } from '@testing-library/react';
import GroupCreate from '../../../../../components/groups/page/create/GroupCreate';
import { AuthContext } from '../../../../../components/auth/Auth';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  keepPreviousData: 'keepPreviousData'
}));

let includeProps: any;
let nameProps: any;

jest.mock('../../../../../components/groups/page/create/GroupCreateWrapper', () => (props: any) => <div data-testid="wrapper">{props.children}</div>);
jest.mock('../../../../../components/groups/page/create/GroupCreateHeader', () => () => <div data-testid="header" />);
jest.mock('../../../../../components/groups/page/create/GroupCreateName', () => (props: any) => { nameProps = props; return <div data-testid="name" />; });
jest.mock('../../../../../components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMeAndPrivate', () => (props: any) => { includeProps = props; return <div data-testid="include" />; });
jest.mock('../../../../../components/groups/page/create/config/GroupCreateConfig', () => () => <div data-testid="config" />);
jest.mock('../../../../../components/groups/page/create/actions/GroupCreateActions', () => () => <div data-testid="actions" />);

const mockedUseQuery = useQuery as jest.Mock;
mockedUseQuery.mockReturnValue({ isFetching: false, data: null });

function renderComponent(ctx: any) {
  mockedUseQuery.mockReturnValueOnce({ isFetching: false, data: null })
                .mockReturnValueOnce({ isFetching: false, data: null });
  return render(
    <AuthContext.Provider value={ctx}>
      <GroupCreate edit="new" onCompleted={jest.fn()} />
    </AuthContext.Provider>
  );
}

describe('GroupCreate', () => {
  it('shows loading indicator when fetching', () => {
    mockedUseQuery.mockReturnValueOnce({ isFetching: true, data: null })
                  .mockReturnValueOnce({ isFetching: true, data: null });
    const { getByText } = renderComponent({ connectedProfile: null });
    expect(getByText('Loading...', { selector: 'div' })).toBeInTheDocument();
  });

  it('allows including primary wallet', () => {
    const ctx = { connectedProfile: { primary_wallet: '0xA', wallets: [{wallet:'0xA'}] } } as any;
    const { rerender } = renderComponent(ctx);
    expect(includeProps.iAmIncluded).toBe(false);
    act(() => { includeProps.setIAmIncluded(true); });
    rerender(
      <AuthContext.Provider value={ctx}>
        <GroupCreate edit="new" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(includeProps.iAmIncluded).toBe(true);
  });
});
