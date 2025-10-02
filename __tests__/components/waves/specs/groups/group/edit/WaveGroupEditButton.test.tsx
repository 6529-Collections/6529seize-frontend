import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import WaveGroupEditButton from '@/components/waves/specs/groups/group/edit/WaveGroupEditButton';
import { ApiWave } from '@/generated/models/ApiWave';

let editProps: any;

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupEdit', () => (props: any) => {
  editProps = props;
  return <div data-testid="edit" data-open={props.isEditOpen} onClick={() => props.onEdit('body')} />;
});

const wave = { id: 'w1' } as ApiWave;

const setup = () => {
  const onEdit = jest.fn(() => Promise.resolve());
  render(<WaveGroupEditButton wave={wave} type={'type'} onEdit={onEdit} />);
  return { onEdit };
};

describe('WaveGroupEditButton', () => {
  it('opens editor on click', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByTestId('edit')).toHaveAttribute('data-open', 'true');
  });

  it('calls onEdit and closes', async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByTitle('Edit'));
    await user.click(screen.getByTestId('edit'));
    expect(onEdit).toHaveBeenCalledWith('body');
    expect(editProps.isEditOpen).toBe(false);
  });
});

