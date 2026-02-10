import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MyStreamWaveMyVoteInput from '@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockReturnValue({ mutateAsync });

const auth = {
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
  connectedProfile: { handle: 'me' }
} as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onDropRateChange: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const drop: any = {
  id: 'd1',
  context_profile_context: { rating: 0, min_rating: 0, max_rating: 10 },
};

describe('MyStreamWaveMyVoteInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clamps vote value within limits and submits on click', async () => {
    render(<MyStreamWaveMyVoteInput drop={drop} />, { wrapper });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15' } });
    expect((input as HTMLInputElement).value).toBe('10');

    fireEvent.click(screen.getByRole('button', { name: 'Submit vote' }));
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ rate: 10 });
  });
});
