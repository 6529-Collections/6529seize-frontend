import { render, screen } from '@testing-library/react';
import React from 'react';
import { UserPageStatsTableHead, UserPageStatsTableHr } from '@/components/user/stats/UserPageStatsTableShared';

describe('UserPageStatsTableShared', () => {
  it('renders table head with all columns', () => {
    render(<table><UserPageStatsTableHead /></table>);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(6);
    expect(headers[1]).toHaveTextContent('Total');
    expect(headers[5]).toHaveTextContent('Meme Lab');
  });

  it('renders hr row spanning specified columns', () => {
    render(<table><tbody><UserPageStatsTableHr span={4} /></tbody></table>);
    const cell = screen.getByRole('cell');
    expect(cell).toHaveAttribute('colspan', '4');
  });
});
