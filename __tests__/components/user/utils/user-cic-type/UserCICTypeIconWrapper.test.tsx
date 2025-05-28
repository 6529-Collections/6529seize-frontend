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
  default: ({ children, content }: any) => <div data-testid="tippy">{children}{content}</div>,
}));

describe('UserCICTypeIconWrapper', () => {
  it('renders icon inside tooltip', () => {
    const profile = { cic: 0 } as ApiIdentity;
    render(<UserCICTypeIconWrapper profile={profile} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('tippy')).toBeInTheDocument();
  });
});
