import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateDropReplying from '@/components/waves/CreateDropReplying';
import type { ApiDrop } from '@/generated/models/ApiDrop';
import { ActiveDropAction } from '@/types/dropInteractionTypes';

describe('CreateDropReplying', () => {
  const drop = { author: { handle: 'bob' } } as unknown as ApiDrop;

  it('shows label according to action', () => {
    render(<CreateDropReplying drop={drop} action={ActiveDropAction.REPLY} onCancel={jest.fn()} disabled={false} />);
    expect(screen.getByText('Replying to')).toBeInTheDocument();
    render(<CreateDropReplying drop={drop} action={ActiveDropAction.QUOTE} onCancel={jest.fn()} disabled={false} />);
    expect(screen.getByText('Quoting')).toBeInTheDocument();
  });

  it('calls onCancel when button clicked', async () => {
    const onCancel = jest.fn();
    render(<CreateDropReplying drop={drop} action={ActiveDropAction.REPLY} onCancel={onCancel} disabled={false} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables button when disabled prop true', () => {
    render(<CreateDropReplying drop={drop} action={ActiveDropAction.REPLY} onCancel={jest.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
