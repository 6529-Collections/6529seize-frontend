import { render, screen } from '@testing-library/react';
import FooterWrapper from '../FooterWrapper';
import Footer from '../components/footer/Footer';
import useDeviceInfo from '../hooks/useDeviceInfo';
import { useRouter } from 'next/router';

jest.mock('../hooks/useDeviceInfo');
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../components/footer/Footer', () => ({ __esModule: true, default: () => <div data-testid="footer" /> }));

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<typeof useDeviceInfo>;
const useRouterMock = useRouter as jest.Mock;

describe('FooterWrapper', () => {
  beforeEach(() => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    useRouterMock.mockReturnValue({ pathname: '/' } as any);
  });

  it('hides footer when running in app', () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    const { container } = render(<FooterWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it('hides footer on specific routes', () => {
    useRouterMock.mockReturnValue({ pathname: '/waves/123' } as any);
    const { container } = render(<FooterWrapper />);
    expect(container.firstChild).toBeNull();
  });

  it('renders footer otherwise', () => {
    useRouterMock.mockReturnValue({ pathname: '/other' } as any);
    render(<FooterWrapper />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
