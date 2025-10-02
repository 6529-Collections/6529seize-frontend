import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipationDropMetadata from '@/components/waves/drops/participation/ParticipationDropMetadata';

jest.mock('@/hooks/isMobileDevice', () => ({ __esModule: true, default: () => false }));

describe('ParticipationDropMetadata', () => {
  const metadata = [
    { data_key: 'k1', data_value: 'v1' },
    { data_key: 'k2', data_value: 'v2' },
    { data_key: 'k3', data_value: 'v3' },
  ];

  it('returns null when no metadata', () => {
    const { container } = render(<ParticipationDropMetadata metadata={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggles show all and show less', async () => {
    const user = userEvent.setup();
    render(<ParticipationDropMetadata metadata={metadata as any} />);
    expect(screen.getByText('Show all')).toBeInTheDocument();
    await user.click(screen.getByText('Show all'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    await user.click(screen.getByText('Show less'));
    expect(screen.getByText('Show all')).toBeInTheDocument();
  });
});
