import { render, screen, fireEvent, act } from '@testing-library/react';
import BlockPickerAdvancedItemBlock from '../../../../components/block-picker/advanced/BlockPickerAdvancedItemBlock';

jest.useFakeTimers();

const mockCopy = jest.fn();

jest.mock('react-use', () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

describe('BlockPickerAdvancedItemBlock', () => {
  beforeEach(() => {
    mockCopy.mockClear();
  });

  it('renders link with highlighted parts', () => {
    render(<BlockPickerAdvancedItemBlock block={12345} blockParts={34} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://etherscan.io/block/countdown/12345');
    expect(link).toHaveTextContent('12345');
    const highlight = screen.getByText('34');
    expect(highlight).toHaveClass('tw-text-error');
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('copies block number to clipboard on click', () => {
    const { container } = render(<BlockPickerAdvancedItemBlock block={222} blockParts={2} />);
    const svg = container.querySelector('svg') as SVGElement;
    fireEvent.click(svg);
    expect(mockCopy).toHaveBeenCalledWith('222');
    expect(screen.getByText('Copied')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });
});
