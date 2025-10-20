import { render, screen } from '@testing-library/react';
import Brain from '@/components/brain/Brain';

jest.mock('@/components/brain/BrainMobile', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid='mobile'>{children}</div>,
}));

jest.mock('@/components/brain/BrainDesktop', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid='desktop'>{children}</div>,
}));

jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useDeviceInfo = jest.requireMock('@/hooks/useDeviceInfo').default as jest.Mock;

describe('Brain', () => {
  beforeEach(() => {
    useDeviceInfo.mockReset();
  });

  it('renders mobile version when running inside the app', () => {
    useDeviceInfo.mockReturnValue({ isApp: true });
    render(<Brain>child</Brain>);

    expect(screen.getByTestId('mobile')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop')).toBeNull();
  });

  it('renders desktop version otherwise', () => {
    useDeviceInfo.mockReturnValue({ isApp: false });
    render(<Brain>desk</Brain>);

    expect(screen.getByTestId('desktop')).toBeInTheDocument();
    expect(screen.getByText('desk')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile')).toBeNull();
  });
});
