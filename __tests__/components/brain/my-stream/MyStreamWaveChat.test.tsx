import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { editSlice } from '../../../../store/editSlice';
import MyStreamWaveChat from '../../../../components/brain/my-stream/MyStreamWaveChat';

const replaceMock = jest.fn();
const searchParamsMock = { get: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
  usePathname: jest.fn(),
}));

let mockIsMemesWave = false;
jest.mock('../../../../hooks/useWave', () => ({ useWave: () => ({ isMemesWave: mockIsMemesWave }) }));

jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ waveViewStyle: { height: '1px' } })
}));

let capturedProps: any = {};
jest.mock('../../../../components/waves/drops/WaveDropsAll', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props;
    return <div data-testid="drops" />;
  }
}));

jest.mock('../../../../components/waves/CreateDropWaveWrapper', () => ({
  CreateDropWaveWrapper: ({ children }: any) => <div>{children}</div>
}));

jest.mock('../../../../components/waves/PrivilegedDropCreator', () => ({
  __esModule: true,
  default: () => <div data-testid="creator" />,
  DropMode: { BOTH: 'BOTH' }
}));

jest.mock('../../../../components/waves/memes/submission/MobileMemesArtSubmissionBtn', () => ({
  __esModule: true,
  default: () => <div data-testid="memes-btn" />
}));

jest.mock('../../../../hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

const wave = { id: '10' } as any;

describe('MyStreamWaveChat', () => {
  let store: any;

  beforeEach(() => {
    capturedProps = {};
    replaceMock.mockClear();
    searchParamsMock.get.mockReset();
    mockIsMemesWave = false;
    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('handles serialNo param and shows memes button', async () => {
    searchParamsMock.get.mockReturnValue('5');
    mockIsMemesWave = true;
    await act(async () => {
      renderWithProvider(<MyStreamWaveChat wave={wave} />);
    });
    expect(replaceMock).toHaveBeenCalled();
    expect(capturedProps.initialDrop).toBe(5);
    expect(screen.getByTestId('memes-btn')).toBeInTheDocument();
  });

  it('sets initialDrop null when no param', async () => {
    searchParamsMock.get.mockReturnValue(null);
    await act(async () => {
      renderWithProvider(<MyStreamWaveChat wave={wave} />);
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(capturedProps.initialDrop).toBeNull();
    expect(screen.queryByTestId('memes-btn')).toBeNull();
  });
});
