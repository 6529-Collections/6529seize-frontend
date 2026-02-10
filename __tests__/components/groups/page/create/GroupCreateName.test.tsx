import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateName from '@/components/groups/page/create/GroupCreateName';

describe('GroupCreateName', () => {
  it('renders input with provided name and label', () => {
    const setName = jest.fn();
    render(<GroupCreateName name="Initial" setName={setName} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Initial');
    expect(input).toHaveAttribute('id', 'floating_name');
    expect(screen.getByLabelText('Name')).toBe(input);
  });

  it('calls setName on change', async () => {
    const handleChange = jest.fn();
    function Wrapper() {
      const [val, setVal] = React.useState('');
      return (
        <GroupCreateName
          name={val}
          setName={(v) => {
            handleChange(v);
            setVal(v);
          }}
        />
      );
    }
    render(<Wrapper />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'NewName');

    expect(handleChange).toHaveBeenLastCalledWith('NewName');
    expect(input).toHaveValue('NewName');
  });
});
