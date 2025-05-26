import { render, screen, fireEvent } from '@testing-library/react';
import CreateDropDesktopFooter from '../../../../../components/drops/create/utils/CreateDropDesktopFooter';
import { CreateDropType } from '../../../../../components/drops/create/types';

describe('CreateDropDesktopFooter', () => {
  it('renders button text based on drop type', () => {
    const onDrop = jest.fn();
    const { rerender } = render(
      <CreateDropDesktopFooter disabled={false} loading={false} type={CreateDropType.DROP} onDrop={onDrop} />
    );
    expect(screen.getByRole('button', { name: /drop/i })).toBeInTheDocument();

    rerender(
      <CreateDropDesktopFooter disabled={false} loading={false} type={CreateDropType.QUOTE} onDrop={onDrop} />
    );
    expect(screen.getByRole('button', { name: /quote/i })).toBeInTheDocument();
  });

  it('calls onDrop when button is clicked and not disabled', () => {
    const onDrop = jest.fn();
    render(
      <CreateDropDesktopFooter disabled={false} loading={false} type={CreateDropType.DROP} onDrop={onDrop} />
    );
    fireEvent.click(screen.getByRole('button', { name: /drop/i }));
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    const onDrop = jest.fn();
    render(
      <CreateDropDesktopFooter disabled={true} loading={false} type={CreateDropType.DROP} onDrop={onDrop} />
    );
    const button = screen.getByRole('button', { name: /drop/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onDrop).not.toHaveBeenCalled();
  });
});
