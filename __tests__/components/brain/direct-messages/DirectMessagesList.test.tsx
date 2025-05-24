import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

jest.mock('../../../../components/brain/left-sidebar/waves/UnifiedWavesListWaves', () => ({
  __esModule: true,
  default: React.forwardRef((props: any, ref) => {
    const handle = {
      containerRef: { current: document.createElement('div') },
      sentinelRef: { current: document.createElement('div') },
    };
    if (typeof ref === 'function') ref(handle);
    else if (ref) (ref as any).current = handle;
    return <div data-testid="waves-list">{props.waves.length}</div>;
  }),
}));

jest.mock('../../../../components/brain/left-sidebar/waves/UnifiedWavesListLoader', () => ({
  __esModule: true,
  UnifiedWavesListLoader: (props: any) => <div data-testid="loader">{String(props.isFetchingNextPage)}</div>,
}));

jest.mock('../../../../components/brain/left-sidebar/waves/UnifiedWavesListEmpty', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="empty">{props.emptyMessage}</div>,
}));

jest.mock('../../../../components/brain/left-sidebar/BrainLeftSidebarCreateADirectMessageButton', () => ({
  __esModule: true,
  default: () => <div data-testid="create-dm-btn" />,
}));

jest.mock('../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({
    directMessages: mockDMs,
    registerWave: jest.fn(),
  }),
}));

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ isAuthenticated: mockAuth }),
}));

jest.mock('../../../../hooks/useDeviceInfo', () => jest.fn(() => ({ isApp: mockIsApp })));

jest.mock('../../../../components/header/user/HeaderUserConnect', () => ({ __esModule: true, default: () => <div data-testid="connect" /> }));
jest.mock('../../../../components/user/utils/set-up-profile/UserSetUpProfileCta', () => ({ __esModule: true, default: () => <div data-testid="setup-profile" /> }));

import DirectMessagesList from '../../../../components/brain/direct-messages/DirectMessagesList';
import { AuthContext } from '../../../../components/auth/Auth';
import useDeviceInfo from '../../../../hooks/useDeviceInfo';

let mockAuth = false;
let mockIsApp = false;
const mockDMs = {
  list: [{ id: '1', name: 'dm' }],
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
};

function renderWithAuth(profile: any) {
  return render(
    <AuthContext.Provider value={{ connectedProfile: profile } as any}>
      <DirectMessagesList scrollContainerRef={React.createRef()} />
    </AuthContext.Provider>
  );
}

describe('DirectMessagesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = false;
    mockIsApp = false;
  });

  it('shows connect wallet placeholder when not authenticated', () => {
    const { container } = renderWithAuth(null);
    expect(container.querySelector('#my-stream-connect')).toBeInTheDocument();
    expect(screen.getByTestId('connect')).toBeInTheDocument();
  });

  it('shows profile setup placeholder when no profile handle', () => {
    mockAuth = true;
    renderWithAuth({ handle: null });
    expect(screen.getByTestId('setup-profile')).toBeInTheDocument();
  });

  it('renders direct messages list and button when authenticated with profile', () => {
    mockAuth = true;
    const { getByTestId } = renderWithAuth({ handle: 'alice' });
    expect(getByTestId('waves-list')).toHaveTextContent('1');
    expect(screen.getByTestId('create-dm-btn')).toBeInTheDocument();
    expect((useDeviceInfo as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });
});
