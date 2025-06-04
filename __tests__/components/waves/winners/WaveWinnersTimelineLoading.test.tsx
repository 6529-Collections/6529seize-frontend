import { render } from '@testing-library/react';
import { WaveWinnersTimelineLoading } from '../../../../components/waves/winners/WaveWinnersTimelineLoading';

test('renders three loading items', () => {
  const { container } = render(<WaveWinnersTimelineLoading />);
  const loaders = container.querySelectorAll('.tw-h-40');
  expect(loaders).toHaveLength(3);
});
