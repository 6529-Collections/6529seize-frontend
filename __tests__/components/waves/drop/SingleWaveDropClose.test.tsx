import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropClose } from '@/components/waves/drop/SingleWaveDropClose';

describe('SingleWaveDropClose', () => {
  it('renders nothing when running in capacitor', () => {
    const onClose = jest.fn();
    render(<SingleWaveDropClose onClose={onClose} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('triggers onClose when clicked', () => {
    const onClose = jest.fn();
    render(<SingleWaveDropClose onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
