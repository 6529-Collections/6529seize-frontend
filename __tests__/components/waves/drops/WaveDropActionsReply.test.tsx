import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import WaveDropActionsReply from '../../../../components/waves/drops/WaveDropActionsReply';
import { WaveEligibilityProvider } from '../../../../contexts/wave/WaveEligibilityContext';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: (p:any) => <div>{p.children}</div> }));

describe('WaveDropActionsReply', () => {
  const baseDrop: any = { id: '1', wave: { authenticated_user_eligible_to_chat: true } };

  it('enables reply when allowed', async () => {
    const user = userEvent.setup();
    const onReply = jest.fn();
    render(
      <WaveEligibilityProvider>
        <WaveDropActionsReply drop={baseDrop} activePartIndex={0} onReply={onReply} />
      </WaveEligibilityProvider>
    );

    const btn = screen.getByRole('button', { name: 'Reply to drop' });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onReply).toHaveBeenCalled();
  });

  it('disables reply for temporary drop', async () => {
    const user = userEvent.setup();
    const onReply = jest.fn();
    const drop = { ...baseDrop, id: 'temp-123' };
    render(
      <WaveEligibilityProvider>
        <WaveDropActionsReply drop={drop} activePartIndex={0} onReply={onReply} />
      </WaveEligibilityProvider>
    );

    const btn = screen.getByRole('button', { name: 'Reply to drop' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onReply).not.toHaveBeenCalled();
  });
});
