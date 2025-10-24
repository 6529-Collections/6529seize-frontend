import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const useKeyPressEvent = jest.fn();

jest.mock('react-use', () => ({
  useKeyPressEvent: (key: string, handler: () => void) => useKeyPressEvent(key, handler),
}));

jest.mock('@/components/utils/select-group/SelectGroupSearchPanel', () => ({
  __esModule: true,
  default: ({ onClose, onGroupSelect }: any) => (
    <div data-testid="search-panel">
      <button onClick={() => onGroupSelect({ id: '1' })}>Select</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('SelectGroupInlinePanel', () => {
  beforeEach(() => {
    useKeyPressEvent.mockClear();
  });

  it('renders and wires callbacks', () => {
    const SelectGroupInlinePanel =
      require('@/components/utils/select-group/SelectGroupInlinePanel').default;
    const onClose = jest.fn();
    const onGroupSelect = jest.fn();

    render(<SelectGroupInlinePanel onClose={onClose} onGroupSelect={onGroupSelect} />);

    expect(screen.getByTestId('search-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Select'));
    expect(onGroupSelect).toHaveBeenCalledWith({ id: '1' });

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(useKeyPressEvent).toHaveBeenCalledWith('Escape', onClose);
  });
});
