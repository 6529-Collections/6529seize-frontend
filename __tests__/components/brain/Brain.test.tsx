import { render, screen } from '@testing-library/react';
let useBreakpointMock = jest.fn();

jest.mock('react-use', () => ({
  createBreakpoint: () => useBreakpointMock,
}));

jest.mock('@/components/brain/BrainMobile', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="mobile">{children}</div>,
}));

jest.mock('@/components/brain/BrainDesktop', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="desktop">{children}</div>,
}));

import Brain from '@/components/brain/Brain';

describe('Brain', () => {
  beforeEach(() => {
    useBreakpointMock.mockReset();
  });

  it('renders mobile version when breakpoint is S', () => {
    useBreakpointMock.mockReturnValue('S');
    render(<Brain>child</Brain>);
    expect(screen.getByTestId('mobile')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop')).not.toBeInTheDocument();
  });

  it('renders desktop version otherwise', () => {
    useBreakpointMock.mockReturnValue('LG');
    render(<Brain>desk</Brain>);
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
    expect(screen.getByText('desk')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile')).not.toBeInTheDocument();
  });
});
