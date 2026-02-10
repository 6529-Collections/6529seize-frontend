import { fireEvent, render, screen } from '@testing-library/react';
import GroupCreateNumericValue from '@/components/groups/page/create/config/common/GroupCreateNumericValue';

describe('GroupCreateNumericValue', () => {
  it('calls setValue with parsed number when input changes', () => {
    const setValue = jest.fn();
    render(
      <GroupCreateNumericValue
        value={5}
        minValue={1}
        maxValue={10}
        label="Numeric"
        labelId="num"
        setValue={setValue}
      />
    );

    const input = screen.getByLabelText('Numeric');
    fireEvent.change(input, { target: { value: '7' } });
    expect(setValue).toHaveBeenCalledWith(7);
  });

  it('calls setValue with null when input is cleared', () => {
    const setValue = jest.fn();
    render(
      <GroupCreateNumericValue
        value={3}
        label="Numeric"
        labelId="num"
        setValue={setValue}
      />
    );

    const input = screen.getByLabelText('Numeric');
    fireEvent.change(input, { target: { value: '' } });
    expect(setValue).toHaveBeenCalledWith(null);
  });
});
