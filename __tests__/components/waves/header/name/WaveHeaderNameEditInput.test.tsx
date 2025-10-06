import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import WaveHeaderNameEditInput from '@/components/waves/header/name/WaveHeaderNameEditInput';

const wave = { id: 'w1' } as any;

describe('WaveHeaderNameEditInput', () => {
  it('updates name on change', () => {
    const setName = jest.fn();
    const { getByPlaceholderText } = render(
      <WaveHeaderNameEditInput wave={wave} name="abc" setName={setName} />
    );
    fireEvent.change(getByPlaceholderText('Please select a name'), { target: { value: 'new' } });
    expect(setName).toHaveBeenCalledWith('new');
  });
});
