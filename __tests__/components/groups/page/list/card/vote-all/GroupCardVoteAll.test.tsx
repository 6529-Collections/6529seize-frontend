import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import GroupCardVoteAll from '@/components/groups/page/list/card/vote-all/GroupCardVoteAll';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { commonApiFetch, commonApiPost } from '@/services/api/common-api';
import { ApiRateMatter } from '@/generated/models/ApiRateMatter';

jest.mock('@tanstack/react-query');
jest.mock('@/services/api/common-api');

jest.mock('@/components/groups/page/list/card/vote-all/GroupCardVoteAllInputs', () => (props: any) => (
  <input data-testid="amount" value={props.amountToAdd ?? ''} onChange={e => props.setAmountToAdd(Number(e.target.value))} />
));

jest.mock('@/components/groups/page/list/card/GroupCardActionWrapper', () => (props: any) => (
  <div>
    {props.children}
    <button onClick={props.onSave} disabled={props.disabled}>Grant</button>
  </div>
));

describe('GroupCardVoteAll', () => {
  const mockUseQuery = useQuery as jest.Mock;
  const mockUseMutation = useMutation as jest.Mock;
  const mockFetch = commonApiFetch as jest.Mock;
  const mockPost = commonApiPost as jest.Mock;

  const auth = { setToast: jest.fn(), requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any;
  const reactQueryCtx = { onIdentityBulkRate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: { count: 1 }, isFetching: false });
    mockUseMutation.mockReturnValue({ mutateAsync: jest.fn().mockResolvedValue({}) });
    mockFetch.mockResolvedValue({ data: { count:1, next:null, data:[{ wallet:'0x1'}] }, success: true });
    mockPost.mockResolvedValue({});
  });

  it('enables grant button when amount entered and performs save', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={reactQueryCtx}>
          <GroupCardVoteAll matter={ApiRateMatter.Cic} group={{ id: 'g1' } as any} onCancel={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByTestId('amount'), { target: { value: '1' } });
    const button = screen.getByText('Grant');
    expect(button).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(auth.requestAuth).toHaveBeenCalled();
  });
});
