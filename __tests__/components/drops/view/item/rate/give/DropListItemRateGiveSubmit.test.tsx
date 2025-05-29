import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import DropListItemRateGiveSubmit from '../../../../../../../components/drops/view/item/rate/give/DropListItemRateGiveSubmit';
import { AuthContext } from '../../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';
import { useDropInteractionRules } from '../../../../../../../hooks/drops/useDropInteractionRules';
import { DropVoteState } from '../../../../../../../hooks/drops/types';

jest.useFakeTimers();

jest.mock('next/dynamic', () => {
  return function dynamic(importFunc: any) {
    const Component = (props: any) => {
      const mod = require('../../../../../../../components/drops/view/item/rate/give/clap/DropListItemRateGiveClap');
      const Actual = mod.default || mod;
      return <Actual {...props} />;
    };
    return Component;
  };
});

jest.mock('../../../../../../../components/drops/view/item/rate/give/clap/DropListItemRateGiveClap', () => (props: any) => (
  <button data-testid="clap" onClick={props.onSubmit}>clap</button>
));

jest.mock('../../../../../../../hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: jest.fn() }));

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockReturnValue({ mutateAsync });
(useDropInteractionRules as jest.Mock).mockReturnValue({ voteState: DropVoteState.CAN_VOTE });

const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn(), connectedProfile: { handle: 'me' } } as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onDropRateChange: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const drop: any = { id: '1', context_profile_context: { rating: 0 } };

describe('DropListItemRateGiveSubmit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('debounces submit and calls mutation', async () => {
    render(<DropListItemRateGiveSubmit rate={1} drop={drop} canVote onSuccessfulRateChange={() => {}} />, { wrapper });
    fireEvent.click(screen.getByTestId('clap'));

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
  });
});
