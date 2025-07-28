import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommonInput from '../../../components/utils/input/CommonInput';

describe('CommonInput', () => {
  it('enforces text maxLength and focus callbacks', () => {
    const onChange = jest.fn();
    const onFocus = jest.fn();
    render(
      <CommonInput
        value=""
        inputType="text"
        maxLength={5}
        onChange={onChange}
        onFocusChange={onFocus}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abcdef' } });
    expect(onChange).toHaveBeenLastCalledWith('abcde');

    fireEvent.focus(input);
    expect(onFocus).toHaveBeenLastCalledWith(true);
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenLastCalledWith(false);
  });

  it('handles number bounds and empty input', () => {
    const onChange = jest.fn();
    render(
      <CommonInput
        value=""
        inputType="number"
        minValue={1}
        maxValue={5}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChange.mock.calls).toEqual([["1"], ["5"]]);
  });

  it('renders search icon when enabled', () => {
    render(
      <CommonInput
        value=""
        showSearchIcon
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
