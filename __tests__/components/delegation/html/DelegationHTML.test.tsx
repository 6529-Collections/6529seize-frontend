import { render, screen, waitFor } from '@testing-library/react';
import DelegationHTML from '@/components/delegation/html/DelegationHTML';

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

test('renders fetched html', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ status: 200, text: () => Promise.resolve('<p>hi</p>') });
  render(<DelegationHTML path="page" title="Hello World" />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  const container = document.querySelector('.htmlContainer') as HTMLElement;
  await waitFor(() => expect(container.innerHTML).toContain('hi'));
  expect(screen.getByText('Hello')).toHaveClass('font-lightest');
});

test('shows 404 page when fetch fails', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ status: 404 });
  render(<DelegationHTML path="missing" title="Missing" />);
  await waitFor(() => expect(screen.getByText('404 | PAGE NOT FOUND')).toBeInTheDocument());
});
