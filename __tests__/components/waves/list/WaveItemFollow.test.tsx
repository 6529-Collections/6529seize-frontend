import { render, screen, fireEvent, act } from '@testing-library/react';
import WaveItemFollow from '../../../../components/waves/list/WaveItemFollow';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { commonApiPost, commonApiDeleteWithBody } from '../../../../services/api/common-api';

jest.mock('@tanstack/react-query');
jest.mock('../../../../services/api/common-api');

const onWaveFollowChange = jest.fn();

const baseAuth = {
  connectedProfile: { handle: 'h' },
  activeProfileProxy: null,
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
};

(useMutation as jest.Mock).mockImplementation((opts) => {
  return {
    mutateAsync: async () => {
      try {
        const r = await opts.mutationFn();
        opts.onSuccess?.(r);
      } catch (e) {
        opts.onError?.(e);
      } finally {
        opts.onSettled?.();
      }
    },
  };
});

describe('WaveItemFollow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes when not yet subscribed', async () => {
    render(
      <AuthContext.Provider value={baseAuth as any}>
        <ReactQueryWrapperContext.Provider value={{ onWaveFollowChange } as any}>
          <WaveItemFollow wave={{ id: 'w', subscribed_actions: [] } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });
    expect(commonApiPost).toHaveBeenCalled();
    expect(onWaveFollowChange).toHaveBeenCalledWith({ waveId: 'w', following: true });
  });

  it('unsubscribes when already subscribed', async () => {
    render(
      <AuthContext.Provider value={baseAuth as any}>
        <ReactQueryWrapperContext.Provider value={{ onWaveFollowChange } as any}>
          <WaveItemFollow wave={{ id: 'w', subscribed_actions: [1] } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });
    expect(commonApiDeleteWithBody).toHaveBeenCalled();
    expect(onWaveFollowChange).toHaveBeenCalledWith({ waveId: 'w', following: false });
  });
});
