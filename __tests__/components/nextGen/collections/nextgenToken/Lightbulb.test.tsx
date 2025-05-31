import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Lightbulb from "../../../../../components/nextGen/collections/nextgenToken/Lightbulb";

jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: ({ content, children }: any) => (
    <span data-testid="tippy" data-content={content}>{children}</span>
  ),
}));

describe('Lightbulb', () => {
  it('renders black mode tooltip and handles click', async () => {
    const onClick = jest.fn();
    const { container } = render(
      <Lightbulb mode="black" className="cls" onClick={onClick} />
    );
    expect(screen.getByTestId('tippy')).toHaveAttribute('data-content', 'Blackbox');
    const svg = container.querySelector('svg')!;
    await userEvent.click(svg);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders light mode tooltip', () => {
    render(<Lightbulb mode="light" className="cls" />);
    expect(screen.getByTestId('tippy')).toHaveAttribute('data-content', 'Lightbox');
  });
});
