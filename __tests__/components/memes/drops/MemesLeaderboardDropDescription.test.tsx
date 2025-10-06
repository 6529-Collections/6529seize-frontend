import { render } from '@testing-library/react';
import MemesLeaderboardDropDescription from '@/components/memes/drops/MemesLeaderboardDropDescription';

test('renders description text', () => {
  const { getByText } = render(<MemesLeaderboardDropDescription description="hello" />);
  expect(getByText('hello')).toBeInTheDocument();
});
