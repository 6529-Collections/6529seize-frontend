import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCustomSnapshotFormTable from '@/components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotFormTable';
import type { CustomTokenPoolParamsToken } from '@/components/allowlist-tool/allowlist-tool.types';

const tokens: CustomTokenPoolParamsToken[] = [
  { owner: '0x1' },
  { owner: '0x2' }
];

describe('CreateCustomSnapshotFormTable', () => {
  it('renders tokens with index', () => {
    render(<CreateCustomSnapshotFormTable tokens={tokens} onRemoveToken={jest.fn()} />);
    expect(screen.getByText('0x1')).toBeInTheDocument();
    expect(screen.getByText('0x2')).toBeInTheDocument();
    // indexes 1 and 2 should be shown
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onRemoveToken when delete clicked', async () => {
    const onRemoveToken = jest.fn();
    render(<CreateCustomSnapshotFormTable tokens={tokens} onRemoveToken={onRemoveToken} />);
    const buttons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(buttons[1]);
    expect(onRemoveToken).toHaveBeenCalledWith(1);
  });
});
