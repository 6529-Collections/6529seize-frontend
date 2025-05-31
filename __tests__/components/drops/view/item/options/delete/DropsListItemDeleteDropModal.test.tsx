import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropsListItemDeleteDropModal from '../../../../../../../components/drops/view/item/options/delete/DropsListItemDeleteDropModal';
import { AuthContext } from '../../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { ApiDropType } from '../../../../../../../generated/models/ApiDropType';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');
jest.mock('../../../../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({ processDropRemoved: jest.fn() }),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const useMutationMock = useMutation as jest.Mock;

describe('DropsListItemDeleteDropModal', () => {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  } as any;
  const rq = { invalidateDrops: jest.fn() } as any;
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
    
    useMutationMock.mockImplementation((opts) => {
      return {
        mutateAsync: async () => {
          await opts.mutationFn();
          opts.onSuccess?.();
          opts.onSettled?.();
          return mutateAsync();
        },
      };
    });
  });

  it('deletes drop after confirmation', async () => {
    const drop = { id: 'd1', drop_type: ApiDropType.Participatory, wave: { id: 'w' } } as any;
    const onDropDeleted = jest.fn();
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <DropsListItemDeleteDropModal drop={drop} closeModal={jest.fn()} onDropDeleted={onDropDeleted} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(auth.setToast).toHaveBeenCalledWith({ message: 'Drop deleted.', type: 'warning' });
    expect(rq.invalidateDrops).toHaveBeenCalled();
    expect(onDropDeleted).toHaveBeenCalled();
  });
});
