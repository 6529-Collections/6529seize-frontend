import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropClose } from '../../../../components/waves/drop/SingleWaveDropClose';

jest.mock('../../../../hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn() }));
const useCapacitor = require('../../../../hooks/useCapacitor').default as jest.Mock;

describe('SingleWaveDropClose', () => {
  it('renders nothing when running in capacitor', () => {
    useCapacitor.mockReturnValue({ isCapacitor: true });
    const { container } = render(<SingleWaveDropClose onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('triggers onClose when clicked', () => {
    useCapacitor.mockReturnValue({ isCapacitor: false });
    const onClose = jest.fn();
    render(<SingleWaveDropClose onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
