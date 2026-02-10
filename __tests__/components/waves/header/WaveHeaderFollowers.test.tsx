import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderFollowers from '@/components/waves/header/WaveHeaderFollowers';

jest.mock('@/helpers/Helpers', () => ({ numberWithCommas: (n: number) => `num-${n}` }));

describe('WaveHeaderFollowers', () => {
  it('displays follower count and handles click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<WaveHeaderFollowers wave={{ metrics: { subscribers_count: 5 } } as any} onFollowersClick={onClick} />);
    expect(screen.getByText('num-5')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
