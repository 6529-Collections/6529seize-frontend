import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveHeaderName from '@/components/waves/header/name/WaveHeaderName';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('@/components/waves/header/name/WaveHeaderNameEdit', () => (props: any) => <div data-testid="edit" />);

jest.mock('@/helpers/waves/waves.helpers', () => ({ canEditWave: jest.fn() }));

const { canEditWave } = require('@/helpers/waves/waves.helpers');

describe('WaveHeaderName', () => {
  const wave = { id: 'w1', name: 'Wave', author: { handle: 'bob' }, wave: {} } as any;

  it('shows edit button when user can edit', () => {
    (canEditWave as jest.Mock).mockReturnValue(true);
    render(<WaveHeaderName wave={wave} />);
    expect(screen.getByTestId('edit')).toBeInTheDocument();
    expect(screen.getByText('Wave').closest('a')).toHaveAttribute('href', '/my-stream?wave=w1');
  });

  it('hides edit button when cannot edit', () => {
    (canEditWave as jest.Mock).mockReturnValue(false);
    render(<WaveHeaderName wave={wave} />);
    expect(screen.queryByTestId('edit')).toBeNull();
  });
});
