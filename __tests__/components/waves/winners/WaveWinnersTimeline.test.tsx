import { render, screen } from '@testing-library/react';
import { WaveWinnersTimeline } from '@/components/waves/winners/WaveWinnersTimeline';
import { format } from 'date-fns';

jest.mock('@/components/waves/winners/WaveWinnersTimelineLoading', () => ({ WaveWinnersTimelineLoading: () => <div data-testid="loading" /> }));
jest.mock('@/components/waves/winners/WaveWinnersEmpty', () => ({ WaveWinnersEmpty: () => <div data-testid="empty" /> }));
const dropsOrder: string[] = [];
jest.mock('@/components/waves/winners/drops/WaveWinnersDrops', () => ({
  WaveWinnersDrops: (props: any) => {
    dropsOrder.push(props.winners[0].drop.id);
    return <div data-testid={`drops-${props.winners[0].drop.id}`} />;
  },
}));

const wave = { id: 'w' } as any;
const makePoint = (id: string, date: string) => ({ decision_time: date, winners: [{ drop: { id } }] });

beforeEach(() => { dropsOrder.length = 0; });

it('shows loading and empty states', () => {
  const { rerender } = render(
    <WaveWinnersTimeline decisionPoints={[]} wave={wave} onDropClick={jest.fn()} isLoading={true} />
  );
  expect(screen.getByTestId('loading')).toBeInTheDocument();
  rerender(
    <WaveWinnersTimeline decisionPoints={[]} wave={wave} onDropClick={jest.fn()} isLoading={false} />
  );
  expect(screen.getByTestId('empty')).toBeInTheDocument();
});

it('sorts decision points and renders drops', () => {
  const points = [
    makePoint('1', '2024-01-01T00:00:00Z'),
    makePoint('2', '2024-01-02T00:00:00Z'),
  ] as any;
  render(
    <WaveWinnersTimeline decisionPoints={points} wave={wave} onDropClick={jest.fn()} isLoading={false} />
  );
  expect(dropsOrder).toEqual(['2', '1']);
  const formatted = format(new Date(points[0].decision_time), 'EEE, MMM d, yyyy');
  expect(screen.getByText(formatted)).toBeInTheDocument();
});
