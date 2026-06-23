import { render } from '@testing-library/react';
import WaveWinnersDropHeaderTotalVotes from '@/components/waves/winners/drops/header/WaveWinnersDropHeaderTotalVotes';
import { ApiWaveCreditType } from '@/generated/models/ApiWaveCreditType';

const baseWinner = {
  place: 4,
  drop: { rating: 1000, wave: { voting_credit_type: ApiWaveCreditType.Tdh } }
} as any;

it('formats rating and credit type', () => {
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={baseWinner} />);
  expect(container.textContent).toContain('1,000');
  expect(container.textContent).toContain('TDH Total');
});

it('uses neutral text when rating is positive', () => {
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={baseWinner} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-text-iron-50');
});

it('uses negative gradient when rating negative', () => {
  const win = { ...baseWinner, drop: { rating: -5, wave: { voting_credit_type: ApiWaveCreditType.Rep } } };
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={win} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-text-rose-400');
});

it('does not special-case top three rank styles', () => {
  const win = { ...baseWinner, place: 1 };
  const { container } = render(<WaveWinnersDropHeaderTotalVotes winner={win} />);
  const span = container.querySelector('span');
  expect(span?.className).toContain('tw-text-iron-50');
});
