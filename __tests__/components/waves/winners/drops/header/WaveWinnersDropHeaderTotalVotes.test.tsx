import { render } from '@testing-library/react';
import WaveWinnersDropHeaderTotalVotes from '@/components/waves/winners/drops/header/WaveWinnersDropHeaderTotalVotes';

const baseWinner = {
  place: 4,
  drop: { rating: 1000, wave: { voting_credit_type: 'CIC' } }
} as any;

it('formats rating and credit type', () => {
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={baseWinner} />);
  expect(container.textContent).toContain('1,000');
  expect(container.textContent).toContain('CIC total');
});

it('uses positive gradient when rating positive', () => {
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={baseWinner} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-from-emerald-400');
});

it('uses negative gradient when rating negative', () => {
  const win = { ...baseWinner, drop: { rating: -5, wave: { voting_credit_type: 'REP' } } };
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={win} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-from-rose-400');
});

it('uses rank style for top three ranks', () => {
  const win = { ...baseWinner, place: 1 };
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={win} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-text-[#E8D48A]');
});
