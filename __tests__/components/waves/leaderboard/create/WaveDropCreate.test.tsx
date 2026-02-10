import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveDropCreate } from '@/components/waves/leaderboard/create/WaveDropCreate';
import type { ApiWave } from '@/generated/models/ApiWave';

jest.mock('@/components/waves/PrivilegedDropCreator', () => ({ __esModule: true, default: (p: any) => <div data-testid="creator" onClick={() => p.onAllDropsAdded()} />, DropMode: { PARTICIPATION: 'PARTICIPATION' } }));

const wave = { id: '1' } as ApiWave;

describe('WaveDropCreate', () => {
  it('renders creator and handles actions', async () => {
    const onCancel = jest.fn();
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(<WaveDropCreate wave={wave} onCancel={onCancel} onSuccess={onSuccess} />);
    await user.click(screen.getByRole('button'));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByTestId('creator'));
    expect(onSuccess).toHaveBeenCalled();
  });
});
