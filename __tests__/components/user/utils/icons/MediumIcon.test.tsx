import { render } from '@testing-library/react';
import MediumIcon from '@/components/user/utils/icons/MediumIcon';

test('renders svg icon', () => {
  const { container } = render(<MediumIcon />);
  const svg = container.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
  expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
});
