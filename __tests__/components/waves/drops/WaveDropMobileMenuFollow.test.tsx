import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropMobileMenuFollow from '@/components/waves/drops/WaveDropMobileMenuFollow';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

jest.mock('@tanstack/react-query');

jest.mock('react-bootstrap', () => ({ Button: (p:any)=> <button {...p} /> }));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockImplementation((opts) => ({
  mutateAsync: async () => {
    await opts.mutationFn();
    opts.onSuccess?.();
    opts.onSettled?.();
    return mutateAsync();
  },
}));

describe('WaveDropMobileMenuFollow', () => {
  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const rq = { invalidateDrops: jest.fn() } as any;
  const drop = { author: { id: '1', handle: 'alice', subscribed_actions: [] } } as any;

  it('does not render when already following', () => {
    const followed = { author: { id: '1', handle: 'alice', subscribed_actions: [1] } } as any;
    const { container } = render(<WaveDropMobileMenuFollow drop={followed} onFollowChange={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('follows when button clicked', async () => {
    const user = userEvent.setup();
    const onFollowChange = jest.fn();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveDropMobileMenuFollow drop={drop} onFollowChange={onFollowChange} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByRole('button'));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(rq.invalidateDrops).toHaveBeenCalled();
    expect(onFollowChange).toHaveBeenCalled();
  });
});
