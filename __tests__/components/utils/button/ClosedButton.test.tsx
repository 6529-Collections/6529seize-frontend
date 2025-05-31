import { render, screen } from '@testing-library/react';
import ClosedButton from '../../../../components/utils/button/ClosedButton';

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />
}));

describe('ClosedButton', () => {
  it('displays loader and disables button when loading', () => {
    render(<ClosedButton loading title="closed">Done</ClosedButton>);
    const button = screen.getByRole('button', { name: 'closed' });
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
