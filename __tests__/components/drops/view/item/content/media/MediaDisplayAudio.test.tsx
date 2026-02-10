import { render, screen } from '@testing-library/react';
import MediaDisplayAudio from '@/components/drops/view/item/content/media/MediaDisplayAudio';

test('renders placeholder when controls hidden', () => {
  render(<MediaDisplayAudio src="a.mp3" />);
  expect(screen.getByText('Audio')).toBeInTheDocument();
});

test('renders audio element when controls shown', () => {
  const { container } = render(<MediaDisplayAudio src="a.mp3" showControls />);
  const audioEl = container.querySelector('audio');
  expect(audioEl).toBeInTheDocument();
  expect(audioEl?.querySelector('source')?.getAttribute('src')).toBe('a.mp3');
});
