import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectGroupModalHeader from '@/components/utils/select-group/SelectGroupModalHeader';

describe('SelectGroupModalHeader', () => {
  it('calls onClose when close button clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<SelectGroupModalHeader onClose={onClose} />);
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
