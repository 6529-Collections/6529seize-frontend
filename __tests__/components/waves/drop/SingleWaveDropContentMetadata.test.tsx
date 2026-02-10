import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleWaveDropContentMetadata } from '@/components/waves/drop/SingleWaveDropContentMetadata';

jest.mock('@/hooks/isMobileDevice', () => ({ __esModule: true, default: jest.fn(() => false) }));

const drop = {
  metadata: [
    { data_key: 'a', data_value: '1' },
    { data_key: 'b', data_value: '2' },
    { data_key: 'c', data_value: '3' }
  ]
} as any;

describe('SingleWaveDropContentMetadata', () => {
  it('toggles additional metadata', () => {
    render(<SingleWaveDropContentMetadata drop={drop} />);
    expect(screen.getByText('a:')).toBeInTheDocument();
    expect(screen.queryByText('c:')).toBeNull();
    fireEvent.click(screen.getByText('Show all'));
    expect(screen.getByText('c:')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show less'));
    expect(screen.queryByText('c:')).toBeNull();
  });
});
