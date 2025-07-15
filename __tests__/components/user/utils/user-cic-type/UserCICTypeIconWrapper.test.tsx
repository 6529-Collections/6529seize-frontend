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

jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: ({ children, content }: any) => (
    <div data-testid="tippy-wrapper">
      {children}
      <div data-testid="tippy-content">{content}</div>
    </div>
  ),
}));

describe('UserCICTypeIconWrapper', () => {
  it('renders icon inside tooltip', () => {
    const profile = { cic: 0, id: 'test-id' } as ApiIdentity;
    render(<UserCICTypeIconWrapper profile={profile} />);
    
    // Check that the icon is rendered
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    
    // Check that the tippy wrapper is rendered
    const tippyWrapper = screen.getByTestId('tippy-wrapper');
    expect(tippyWrapper).toBeInTheDocument();
    
    // Check that the tooltip content is rendered
    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
