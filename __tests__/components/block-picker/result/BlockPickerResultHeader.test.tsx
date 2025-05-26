import { render, screen } from '@testing-library/react';
import BlockPickerResultHeader from '../../../../components/block-picker/result/BlockPickerResultHeader';

jest.mock('../../../../components/distribution-plan-tool/common/Countdown', () => ({
  __esModule: true,
  default: ({ timestamp }: any) => <div data-testid="countdown">{`countdown-${timestamp}`}</div>,
}));

describe('BlockPickerResultHeader', () => {
  it('renders block number, formatted date and countdown', () => {
    const timestamp = Date.UTC(2023, 0, 2, 15, 30);
    render(<BlockPickerResultHeader blocknumber={123} timestamp={timestamp} />);
    expect(screen.getByText('123')).toBeInTheDocument();
    const formatted = new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    expect(screen.getByText(new RegExp(formatted))).toBeInTheDocument();
    expect(screen.getByTestId('countdown')).toHaveTextContent(`countdown-${timestamp}`);
  });
});
