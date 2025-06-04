import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import DecisionPointDropdown from '../../../../../components/waves/create-wave/dates/DecisionPointDropdown';
import { Period } from '../../../../../helpers/Types';

describe('DecisionPointDropdown', () => {
  it('selects option and closes menu', () => {
    const onChange = jest.fn();
    const { getByRole, queryByText } = render(
      <DecisionPointDropdown value={Period.DAYS} onChange={onChange} />
    );
    fireEvent.click(getByRole('button'));
    expect(queryByText('Hours')).not.toBeNull(); // Hours option should be visible in open dropdown
    fireEvent.click(getByRole('button', { name: 'Hours' }));
    expect(onChange).toHaveBeenCalledWith(Period.HOURS);
    expect(queryByText('Hours')).toBeNull(); // Hours option should no longer be visible after dropdown closes
  });
});
