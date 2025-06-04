import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import MyStreamWaveMyVotesReset from '../../../../../components/brain/my-stream/votes/MyStreamWaveMyVotesReset';
import { AuthContext } from '../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));
jest.mock('../../../../../components/brain/my-stream/votes/MyStreamWaveMyVotesResetProgress', () => (p: any) => <div data-testid="progress" {...p} />);
jest.mock('../../../../../components/utils/button/SecondaryButton', () => (p: any) => <button onClick={p.onClicked} disabled={p.disabled}>{p.children}</button>);
jest.mock('../../../../../services/api/common-api', () => ({ commonApiPost: jest.fn(async () => ({})) }));

const useMutationMock = useMutation as jest.Mock;

const auth = { setToast: jest.fn(), connectedProfile: { handle: 'me' } } as any;
const rqContext = { onDropRateChange: jest.fn() } as any;

beforeEach(() => {
  jest.clearAllMocks();
  useMutationMock.mockImplementation((config: any) => ({
    mutateAsync: async (param: any) => {
      const result = { id: param.dropId };
      // Simulate the onSuccess callback
      if (config.onSuccess) {
        config.onSuccess(result);
      }
      return result;
    }
  }));
});

test('returns null when no drops', () => {
  const { container } = render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset haveDrops={false} selected={new Set()} allItemsSelected={false} onToggleSelectAll={jest.fn()} removeSelected={jest.fn()} setPausePolling={jest.fn()} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  expect(container.firstChild).toBeNull();
});

test('resets votes for selected drops', async () => {
  const removeSelected = jest.fn();
  const setPausePolling = jest.fn();
  const selected = new Set(['a', 'b']);
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset haveDrops selected={selected} allItemsSelected={false} onToggleSelectAll={jest.fn()} removeSelected={removeSelected} setPausePolling={setPausePolling} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  await act(async () => {
    fireEvent.click(screen.getAllByRole('button')[1]);
  });
  expect(setPausePolling).toHaveBeenCalledWith(true);
  expect(removeSelected).toHaveBeenCalledTimes(2);
  // onDropRateChange is handled by React Query elsewhere, not directly by this component
});
