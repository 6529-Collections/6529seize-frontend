import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableRowGas from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowGas';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

describe('UserPageStatsActivityWalletTableRowGas', () => {
  it('shows gas information in tooltip', () => {
    render(<UserPageStatsActivityWalletTableRowGas gas={1.23456} gasGwei={123} gasPriceGwei={45.67} />);
    expect(screen.getByLabelText('Gas Information')).toBeInTheDocument();
    
    // Check that the tooltip element is rendered
    const tooltip = screen.getByTestId('react-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-tooltip-id', 'gas-information');
    
    // Check that the tooltip content contains gas information
    expect(tooltip.textContent).toContain('Gas:');
    expect(tooltip.textContent).toContain('1.23456');
    expect(tooltip.textContent).toContain('123');
    expect(tooltip.textContent).toContain('45.67');
  });
});
