import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NumberTrait } from '../../components/waves/memes/traits/NumberTrait';

jest.mock('react-use', () => ({ useDebounce: (fn: any, _ms: number) => fn() }));

describe('NumberTrait', () => {
  const traits: any = { size: 0 };
  it('clears zero on focus and restores on blur', () => {
    const update = jest.fn();
    render(
      <NumberTrait label="Size" field="size" traits={traits} updateNumber={update} />
    );
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.focus(input);
    expect(input.value).toBe('');
    fireEvent.blur(input);
    // value returns to 0 but no update since value unchanged
    expect(update).not.toHaveBeenCalled();
    expect(input.value).toBe('0');
  });

  it('enforces min and max bounds', () => {
    const update = jest.fn();
    render(
      <NumberTrait label="Size" field="size" traits={{ size: 5 }} updateNumber={update} min={1} max={10} />
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.blur(input);
    expect(update).toHaveBeenLastCalledWith('size', 10);
  });
});
