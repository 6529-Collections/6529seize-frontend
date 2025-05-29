import React from 'react';
import { render } from '@testing-library/react';
import WaveDropsAll from '../../../../components/waves/drops/WaveDropsAll';
import { useVirtualizedWaveDrops } from '../../../../hooks/useVirtualizedWaveDrops';

jest.mock('../../../../hooks/useVirtualizedWaveDrops');
jest.mock('../../../../components/waves/drops/WaveDropsReverseContainer', () => ({ __esModule: true, WaveDropsReverseContainer: (props: any) => <div data-testid="container">{props.children}</div> }));
jest.mock('../../../../components/drops/view/DropsList', () => ({ __esModule: true, default: (props: any) => <div data-testid="drops" {...props} /> }));
jest.mock('../../../../components/waves/drops/WaveDropsScrollBottomButton', () => ({ __esModule: true, default: () => <div data-testid="scroll-btn" /> }));
jest.mock('../../../../components/waves/drops/WaveDropsEmptyPlaceholder', () => ({ __esModule: true, default: () => <div data-testid="empty" /> }));
jest.mock('../../../../components/waves/drops/WaveDropsScrollingOverlay', () => ({ __esModule: true, default: () => <div data-testid="overlay" /> }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../../../hooks/useScrollBehavior', () => ({ useScrollBehavior: () => ({ scrollContainerRef: { current: null }, scrollToVisualBottom: jest.fn() }) }));
jest.mock('../../../../hooks/useWaveIsTyping', () => ({ useWaveIsTyping: () => null }));
jest.mock('../../../../components/notifications/NotificationsContext', () => ({ useNotificationsContext: () => ({ removeWaveDeliveredNotifications: jest.fn() }) }));
jest.mock('../../../../components/auth/Auth', () => ({ useAuth: () => ({ connectedProfile: null }) }));
jest.mock('../../../../services/api/common-api', () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({ 
  __esModule: true, 
  default: () => <svg data-testid="circle-loader" />,
  CircleLoaderSize: { XXLARGE: 'xxlarge' }
}));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <div data-testid="icon" />
}));

const useVirtualizedWaveDropsMock = useVirtualizedWaveDrops as jest.Mock;

function renderComp(overrides?: any) {
  useVirtualizedWaveDropsMock.mockReturnValue({
    waveMessages: { isLoading: false, isLoadingNextPage: false, hasNextPage: false, drops: [], ...overrides?.messages },
    fetchNextPage: jest.fn(),
    waitAndRevealDrop: jest.fn()
  });
  return render(
    <WaveDropsAll
      waveId="1"
      dropId={null}
      onReply={jest.fn()}
      onQuote={jest.fn()}
      activeDrop={null}
      initialDrop={null}
    />
  );
}

describe.skip('WaveDropsAll', () => {
  it('shows loader when loading and empty', () => {
    const { container } = renderComp({ messages: { isLoading: true, drops: [] } });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows empty placeholder when no drops', () => {
    const { getByTestId } = renderComp();
    expect(getByTestId('empty')).toBeInTheDocument();
  });

  it('renders drops list when drops present', () => {
    const { getByTestId } = renderComp({ messages: { drops: [{ id: 'd1' }] } });
    expect(getByTestId('drops')).toBeInTheDocument();
  });
});
