import { render, screen } from '@testing-library/react';
import UserCICTypeIcon from '@/components/user/utils/user-cic-type/UserCICTypeIcon';

jest.mock('@/components/user/utils/user-cic-type/icons/UserCICInaccurateIcon', () => () => <div data-testid="inaccurate" />);
jest.mock('@/components/user/utils/user-cic-type/icons/UserCICUnknownIcon', () => () => <div data-testid="unknown" />);
jest.mock('@/components/user/utils/user-cic-type/icons/UserCICProbablyAccurateIcon', () => () => <div data-testid="probably" />);
jest.mock('@/components/user/utils/user-cic-type/icons/UserCICAccurateIcon', () => () => <div data-testid="accurate" />);
jest.mock('@/components/user/utils/user-cic-type/icons/UserCICHighlyAccurateIcon', () => () => <div data-testid="highly" />);

describe('UserCICTypeIcon', () => {
  it('renders inaccurate icon for negative CIC', () => {
    render(<UserCICTypeIcon cic={-30} />);
    expect(screen.getByTestId('inaccurate')).toBeInTheDocument();
  });

  it('renders probably accurate icon for mid CIC', () => {
    render(<UserCICTypeIcon cic={1500} />);
    expect(screen.getByTestId('probably')).toBeInTheDocument();
  });

  it('renders highly accurate icon for high CIC', () => {
    render(<UserCICTypeIcon cic={30000} />);
    expect(screen.getByTestId('highly')).toBeInTheDocument();
  });
});
