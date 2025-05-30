import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropMobileMenuDelete from '../../../../components/waves/drops/WaveDropMobileMenuDelete';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('framer-motion', () => ({ motion: { button: (p: any) => <button {...p} />, div: (p: any) => <div {...p} /> }, AnimatePresence: (p: any) => <div>{p.children}</div> }));

const mutateAsync = jest.fn();
let onSuccess: any;
jest.mock('@tanstack/react-query', () => ({
  useMutation: (config: any) => {
    onSuccess = config.onSuccess;
    return { mutateAsync };
  },
}));

jest.mock('../../../../contexts/wave/MyStreamContext', () => ({ useMyStream: () => ({ processDropRemoved: jest.fn() }) }));

describe('WaveDropMobileMenuDelete', () => {
  const drop = { id: '1', wave: { id: 'w' } } as any;
  const invalidateDrops = jest.fn();
  const setToast = jest.fn();
  const onDropDeleted = jest.fn();
  const requestAuth = jest.fn();

  function renderComponent(authSuccess = true) {
    requestAuth.mockResolvedValue({ success: authSuccess });
    return render(
      <AuthContext.Provider value={{ requestAuth, setToast } as any}>
        <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
          <WaveDropMobileMenuDelete drop={drop} onDropDeleted={onDropDeleted} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
  }

  beforeEach(() => {
    mutateAsync.mockImplementation(() => {
      onSuccess();
      return Promise.resolve();
    });
    jest.clearAllMocks();
  });

  it('toggles delete mode and confirms deletion', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Delete'));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    await user.click(screen.getByText('Are you sure?'));
    expect(mutateAsync).toHaveBeenCalled();
    expect(onDropDeleted).toHaveBeenCalled();
  });

  it('does not delete when auth fails', async () => {
    const user = userEvent.setup();
    renderComponent(false);
    await user.click(screen.getByText('Delete'));
    await user.click(screen.getByText('Are you sure?'));
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
