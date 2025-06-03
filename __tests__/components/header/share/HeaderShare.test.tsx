import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderShare from '../../../../components/header/share/HeaderShare';
import useCapacitor from '../../../../hooks/useCapacitor';
import useIsMobileDevice from '../../../../hooks/isMobileDevice';

jest.mock('../../../../hooks/useCapacitor');
jest.mock('../../../../hooks/isMobileDevice');
jest.mock('next/router', () => ({ useRouter: () => ({ asPath: '/' }) }));
jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img alt="" {...p} /> }));
jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('../../../../hooks/useElectron', () => ({ useElectron: () => false }));
jest.mock('../../../../components/header/share/HeaderShareMobileApps', () => ({ ShareMobileApp: () => <div>MobileApp</div> }));
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ isAuthenticated: false }) }));
jest.mock('react-bootstrap', () => {
  const Modal = ({ show, children }: any) => (show ? <div data-testid="modal">{children}</div> : null);
  const Button = (p: any) => <button {...p} />;
  const ModalBody = ({ children }: any) => <div>{children}</div>;
  (Modal as any).Body = ModalBody;
  return { Modal, Button };
});
jest.mock('qrcode', () => ({ toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64')) }));

const mockUseCapacitor = useCapacitor as jest.MockedFunction<typeof useCapacitor>;
const mockIsMobile = useIsMobileDevice as jest.MockedFunction<typeof useIsMobileDevice>;

describe('HeaderShare', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders nothing when running in Capacitor', () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true } as any);
    mockIsMobile.mockReturnValue(false as any);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on mobile devices', () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(true as any);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it('shows QR button and opens modal on click', async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false as any);
    render(<HeaderShare />);
    const btn = screen.getByRole('button', { name: 'QR Code' });
    await userEvent.click(btn);
    expect(await screen.findByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Current URL')).toBeInTheDocument();
  });

  it('copies url to clipboard', async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false as any);
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    const { container } = render(<HeaderShare />);
    await userEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    const modal = await screen.findByTestId('modal');
    const icon = modal.querySelector('[data-icon="copy"]') as HTMLElement;
    await userEvent.click(icon);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('generates QR codes when modal opens', async () => {
    const qrcode = require('qrcode');
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false as any);
    render(<HeaderShare />);
    await userEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    await screen.findByTestId('modal');
    expect(qrcode.toDataURL).toHaveBeenCalled();
  });
});
