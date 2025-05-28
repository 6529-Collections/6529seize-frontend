import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewVersionToast from '../../../components/utils/NewVersionToast';
import { useIsStale } from '../../../hooks/useVersion';
import { useRouter } from 'next/router';
import useDeviceInfo from '../../../hooks/useDeviceInfo';

jest.mock('../../../hooks/useVersion', () => ({ useIsStale: jest.fn() }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../hooks/useDeviceInfo', () => ({ __esModule: true, default: jest.fn() }));

const mockedUseIsStale = useIsStale as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseDeviceInfo = useDeviceInfo as jest.Mock;

describe('NewVersionToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when not stale', () => {
    mockedUseIsStale.mockReturnValue(false);
    mockedUseRouter.mockReturnValue({ reload: jest.fn() });
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });
    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toast and reloads on click', async () => {
    const reload = jest.fn();
    mockedUseIsStale.mockReturnValue(true);
    mockedUseRouter.mockReturnValue({ reload });
    mockedUseDeviceInfo.mockReturnValue({ isApp: true });

    const { container } = render(<NewVersionToast />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('tw-bottom-24');
    await userEvent.click(screen.getByRole('button'));
    expect(reload).toHaveBeenCalled();
  });

  it('uses bottom-6 class when not in app', () => {
    mockedUseIsStale.mockReturnValue(true);
    mockedUseRouter.mockReturnValue({ reload: jest.fn() });
    mockedUseDeviceInfo.mockReturnValue({ isApp: false });

    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toHaveClass('tw-bottom-6');
  });
});
