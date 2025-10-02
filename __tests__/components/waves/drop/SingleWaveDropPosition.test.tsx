import { render } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropPosition } from '@/components/waves/drop/SingleWaveDropPosition';

jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => () => <div data-testid="badge" />);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p: any) => <svg data-testid="fa" {...p} /> }));

test('returns null when no rank', () => {
  const { container } = render(<SingleWaveDropPosition rank={null} />);
  expect(container.firstChild).toBeNull();
});

test('renders trophy when winner', () => {
  const { getByTestId } = render(<SingleWaveDropPosition rank={1} isFinalWinner={true} />);
  expect(getByTestId('fa')).toBeInTheDocument();
});

test('renders badge when not winner', () => {
  const drop = { winning_context: false } as any;
  const { getByTestId } = render(<SingleWaveDropPosition rank={2} drop={drop} />);
  expect(getByTestId('badge')).toBeInTheDocument();
});
