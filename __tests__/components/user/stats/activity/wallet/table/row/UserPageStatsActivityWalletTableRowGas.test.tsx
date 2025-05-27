import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableRowGas from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowGas';

jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="tippy">
      <div data-testid="tippy-content">{props.content}</div>
      {props.children}
    </div>
  )
}));

describe('UserPageStatsActivityWalletTableRowGas', () => {
  it('shows gas information in tooltip', () => {
    render(<UserPageStatsActivityWalletTableRowGas gas={1.23456} gasGwei={123} gasPriceGwei={45.67} />);
    expect(screen.getByLabelText('Gas Information')).toBeInTheDocument();
    const content = screen.getByTestId('tippy-content');
    expect(content.textContent).toContain('Gas:');
    expect(content.textContent).toContain('1.23456');
    expect(content.textContent).toContain('123');
    expect(content.textContent).toContain('45.67');
  });
});
