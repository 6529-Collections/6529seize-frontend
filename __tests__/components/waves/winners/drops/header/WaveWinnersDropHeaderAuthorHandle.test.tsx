import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveWinnersDropHeaderAuthorHandle from '@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorHandle';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick }: any) => <a href={href} onClick={onClick}>{children}</a> }));
jest.mock('@/components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: ({ level }: any) => <span data-testid="level">{level}</span>,
  UserCICAndLevelSize: { SMALL: 'SMALL' },
}));

describe('WaveWinnersDropHeaderAuthorHandle', () => {
  const winner = { drop: { author: { handle: 'alice', level: 4 } } } as any;

  it('renders handle link, level, and stops propagation', () => {
    const stop = jest.fn();
    const { getByText, getByTestId } = render(
      <div onClick={stop}>
        <WaveWinnersDropHeaderAuthorHandle winner={winner} />
      </div>
    );
    const link = getByText('alice');
    expect(link.getAttribute('href')).toBe('/alice');
    expect(getByTestId('level')).toHaveTextContent('4');
    fireEvent.click(link);
    expect(stop).not.toHaveBeenCalled();
  });
});
