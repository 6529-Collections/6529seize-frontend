import { render } from '@testing-library/react';
import { WaveWinnersTimelineLoading } from '@/components/waves/winners/WaveWinnersTimelineLoading';

test('renders three loading items', () => {
  const { container } = render(<WaveWinnersTimelineLoading />);
  const loaders = container.querySelectorAll('.tw-relative.tw-flex.tw-gap-4.tw-pb-8');
  expect(loaders).toHaveLength(3);
});
