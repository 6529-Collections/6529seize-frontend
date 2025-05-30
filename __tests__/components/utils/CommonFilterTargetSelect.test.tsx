import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CommonFilterTargetSelect, { FilterTargetType } from '../../../components/utils/CommonFilterTargetSelect';

describe('CommonFilterTargetSelect', () => {
  it('renders radio buttons and triggers change', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CommonFilterTargetSelect selected={FilterTargetType.ALL} onChange={onChange} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(3);
    await user.click(screen.getByLabelText('Outgoing'));
    expect(onChange).toHaveBeenCalledWith(FilterTargetType.OUTGOING);
  });
});
