import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveHeaderFollow from '../../../../components/waves/header/WaveHeaderFollow';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { commonApiPost, commonApiDeleteWithBody } from '../../../../services/api/common-api';

jest.mock('@tanstack/react-query');
jest.mock('../../../../services/api/common-api');

(useMutation as jest.Mock).mockImplementation((opts) => ({
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
}));

describe('WaveHeaderFollow', () => {
  const baseAuth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  } as any;
  const rq = { onWaveFollowChange: jest.fn() } as any;
  beforeEach(() => jest.clearAllMocks());

  it('follows when not subscribed', async () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderFollow wave={{ id: 'w', subscribed_actions: [] } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });
    expect(commonApiPost).toHaveBeenCalled();
    expect(rq.onWaveFollowChange).toHaveBeenCalledWith({ waveId: 'w', following: true });
  });

  it('unfollows when already subscribed', async () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderFollow wave={{ id: 'w', subscribed_actions: [1] } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });
    expect(commonApiDeleteWithBody).toHaveBeenCalled();
    expect(rq.onWaveFollowChange).toHaveBeenCalledWith({ waveId: 'w', following: false });
  });
});
