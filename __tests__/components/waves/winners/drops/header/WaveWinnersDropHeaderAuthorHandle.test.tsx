import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveWinnersDropHeaderAuthorHandle from '../../../../../../components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorHandle';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick }: any) => <a href={href} onClick={onClick}>{children}</a> }));

describe('WaveWinnersDropHeaderAuthorHandle', () => {
  const winner = { drop: { author: { handle: 'alice' } } } as any;

  it('renders handle link and stops propagation', () => {
    const stop = jest.fn();
    const { getByText } = render(
      <div onClick={stop}>
        <WaveWinnersDropHeaderAuthorHandle winner={winner} />
      </div>
    );
    const link = getByText('alice');
    expect(link.getAttribute('href')).toBe('/alice');
    fireEvent.click(link);
    expect(stop).not.toHaveBeenCalled();
  });
});
