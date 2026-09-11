import React from 'react';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderNameEditModal from '@/components/waves/header/name/WaveHeaderNameEditModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { convertWaveToUpdateWave } from '@/helpers/waves/waves.helpers';
import { createMockApiWave } from '@/__tests__/utils/mockFactories';
import { createMockAuthContext } from '@/__tests__/utils/testContexts';

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
  const auth = createMockAuthContext({
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  });
  const rq = {
    onWaveCreated: jest.fn(),
  } as React.ContextType<typeof ReactQueryWrapperContext>;

  it('picks up a rename that landed while the dialog was closed', () => {
    const { rerender } = render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderNameEditModal
            isOpen={false}
            wave={createMockApiWave({ id: '1', name: 'Old' })}
            onClose={jest.fn()}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    // The name derives from the wave whenever the user has not typed, so a
    // rename landing while the dialog was closed shows up on the next open
    // regardless of whether it arrives before or with the open.
    rerender(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderNameEditModal
            isOpen
            wave={createMockApiWave({ id: '1', name: 'Renamed elsewhere' })}
            onClose={jest.fn()}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByPlaceholderText('Please select a name')).toHaveValue(
      'Renamed elsewhere'
    );
  });

  it('renders on the shared dialog surface above the wave sidebar', () => {
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderNameEditModal isOpen wave={createMockApiWave({ id: '1', name: 'Old' })} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    // The hand-rolled portal this replaced sat at tw-z-50, which rendered the
    // rename form underneath the wave sidebar, and had no keyboard handling,
    // so the native keyboard covered the input and Save.
    const dialog = screen.getByRole('dialog', { name: 'Rename wave' });
    expect(dialog).toHaveClass('tw-z-[9999]');
    expect(dialog.querySelector('.mobile-wrapper-dialog')).not.toBeNull();

    // Opens straight into the field, which headless-ui resolves via
    // data-autofocus.
    expect(screen.getByPlaceholderText('Please select a name')).toHaveAttribute(
      'data-autofocus'
    );
  });

  it('submits new name', async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderNameEditModal isOpen wave={createMockApiWave({ id: '1', name: 'Old' })} onClose={jest.fn()} />
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
