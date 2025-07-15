import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Lightbulb from "../../../../../components/nextGen/collections/nextgenToken/Lightbulb";

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id, content }: any) => (
    <div data-testid={`tooltip-${id}`} data-content={content}>
      {children}
    </div>
  ),
}));

describe('Lightbulb', () => {
  it('renders black mode tooltip and handles click', async () => {
    const onClick = jest.fn();
    const { container } = render(
      <Lightbulb mode="black" className="cls" onClick={onClick} />
    );
    expect(screen.getByTestId('tooltip-lightbulb-blackbox')).toHaveAttribute('data-content', 'Blackbox');
    const svg = container.querySelector('svg')!;
    await userEvent.click(svg);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders light mode tooltip', () => {
    render(<Lightbulb mode="light" className="cls" />);
    expect(screen.getByTestId('tooltip-lightbulb-lightbox')).toHaveAttribute('data-content', 'Lightbox');
  });
});
