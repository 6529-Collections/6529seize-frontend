import React from 'react';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock react-dom first 
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderNameEditModal from '@/components/waves/header/name/WaveHeaderNameEditModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { convertWaveToUpdateWave } from '@/helpers/waves/waves.helpers';

jest.mock('@/helpers/waves/waves.helpers', () => ({ convertWaveToUpdateWave: jest.fn(() => ({ id: '1' })) }));
jest.mock('@tanstack/react-query');

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockImplementation((opts) => ({
  mutateAsync: async (body: any) => {
    await opts.mutationFn(body);
    opts.onSuccess?.();
    opts.onSettled?.();
    return mutateAsync();
  },
}));

describe('WaveHeaderNameEditModal', () => {
  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const rq = { onWaveCreated: jest.fn() } as any;

  it('submits new name', async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderNameEditModal wave={{ id: '1', name: 'Old' } as any} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const nameInput = screen.getByPlaceholderText('Please select a name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(auth.requestAuth).toHaveBeenCalled();
    expect(convertWaveToUpdateWave).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(rq.onWaveCreated).toHaveBeenCalled();
  });
});
