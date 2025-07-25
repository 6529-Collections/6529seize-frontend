import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UserPageWaves from '../../../../components/user/waves/UserPageWaves';
import { AuthContext } from '../../../../components/auth/Auth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { createMockAuthContext } from '../../../utils/testContexts';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';
import { ApiWave } from '../../../../generated/models/ApiWave';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useInfiniteQuery: jest.fn() }));
jest.mock('react-use', () => ({ useDebounce: jest.fn() }));

jest.mock('../../../../components/user/waves/UserPageWavesSearch', () =>
  function MockSearch(props: any) {
    return (
      <div data-testid="search">
        {props.showCreateNewWaveButton && (
          <button data-testid="create" onClick={props.onCreateNewWave} />
        )}
        <input data-testid="name" value={props.waveName || ''} onChange={(e) => props.setWaveName(e.target.value || null)} />
      </div>
    );
  }
);

jest.mock('../../../../components/waves/list/WaveItem', () =>
  function MockItem({ wave }: { wave: ApiWave }) {
    return <div data-testid={`wave-${wave.id}`}>{wave.name}</div>;
  }
);

jest.mock('../../../../components/utils/CommonIntersectionElement', () =>
  function MockInter({ onIntersection }: any) {
    return <div data-testid="inter" onClick={() => onIntersection(true)} />;
  }
);

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () =>
  function MockLoader() {
    return <div data-testid="loader" />;
  }
);

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

const waves = [
  { id: 'w1', name: 'Wave 1', serial_no: 10 } as ApiWave,
  { id: 'w2', name: 'Wave 2', serial_no: 9 } as ApiWave,
];

const profile: ApiIdentity = { handle: 'me' } as ApiIdentity;

let fetchNextPageMock: jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  fetchNextPageMock = jest.fn();
  useRouterMock.mockReturnValue({ push: jest.fn() });
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [waves] },
    fetchNextPage: fetchNextPageMock,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    status: 'success',
  });
});

function renderComp(authOverrides = {}) {
  const auth = createMockAuthContext({ connectedProfile: { handle: 'me' }, activeProfileProxy: null, ...authOverrides });
  return render(
    <AuthContext.Provider value={auth}>
      <UserPageWaves profile={profile} />
    </AuthContext.Provider>
  );
}

test('shows create wave button for own profile', () => {
  renderComp();
  expect(screen.getByTestId('create')).toBeInTheDocument();
});

test('loads waves and triggers next page on intersection', () => {
  const { getByTestId } = renderComp();
  expect(getByTestId('wave-w1')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('inter'));
  expect(fetchNextPageMock).toHaveBeenCalled();
});

test('hides create button when viewing other profile', () => {
  renderComp({ connectedProfile: { handle: 'other' } });
  expect(screen.queryByTestId('create')).not.toBeInTheDocument();
});
