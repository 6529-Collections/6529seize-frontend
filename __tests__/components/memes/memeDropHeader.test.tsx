import { render, screen } from '@testing-library/react';
import MemeDropHeader from '@/components/memes/drops/meme-participation-drop/MemeDropHeader';

test('renders title', () => {
  render(<MemeDropHeader title="My Drop" />);
  expect(screen.getByRole('heading')).toHaveTextContent('My Drop');
});
