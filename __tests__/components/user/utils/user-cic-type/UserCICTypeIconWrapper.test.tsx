import { render, screen } from '@testing-library/react';
import UserCICTypeIconWrapper from '../../../../../components/user/utils/user-cic-type/UserCICTypeIconWrapper';
import { ApiIdentity } from '../../../../../generated/models/ApiIdentity';

jest.mock('../../../../../components/user/utils/user-cic-type/UserCICTypeIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

jest.mock('../../../../../components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltip', () => ({
  __esModule: true,
  default: () => <div data-testid="tooltip" />,
}));

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

describe('UserCICTypeIconWrapper', () => {
  it('renders icon with react-tooltip', () => {
    const profile = { cic: 0, id: 'test-id' } as ApiIdentity;
    render(<UserCICTypeIconWrapper profile={profile} />);
    
    // Check that the icon is rendered
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    
    // Check that the react-tooltip is rendered
    const tooltip = screen.getByTestId('react-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-tooltip-id', 'user-cic-type-tooltip-test-id');
    
    // Check that the tooltip content is rendered
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
