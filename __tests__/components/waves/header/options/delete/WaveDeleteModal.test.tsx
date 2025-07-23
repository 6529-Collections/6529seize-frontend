import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDeleteModal from '../../../../../../components/waves/header/options/delete/WaveDeleteModal';
import { AuthContext } from '../../../../../../components/auth/Auth';
jest.mock("../../../../../../services/api/common-api", () => ({ commonApiDelete: jest.fn() }));
import { ReactQueryWrapperContext } from '../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

jest.mock('@tanstack/react-query');
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

const useMutationMock = useMutation as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

describe('WaveDeleteModal', () => {
  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const rq = { invalidateDrops: jest.fn() } as any;
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    useRouterMock.mockReturnValue({ push });
    useMutationMock.mockImplementation((opts) => ({
      mutateAsync: async () => {
        await opts.mutationFn();
        opts.onSuccess?.();
        opts.onSettled?.();
        return mutateAsync();
      },
    }));
  });

  it('deletes wave and navigates away', async () => {
    const user = userEvent.setup();
    const wave = { id: 'w1' } as any;
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveDeleteModal wave={wave} closeModal={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(auth.setToast).toHaveBeenCalledWith({ message: 'Wave deleted.', type: 'warning' });
    expect(rq.invalidateDrops).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/my-stream');
  });
});
