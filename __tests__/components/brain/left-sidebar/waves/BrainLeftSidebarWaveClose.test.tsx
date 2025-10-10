import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrainLeftSidebarWaveClose from '@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveClose';
import { useRouter } from 'next/navigation';
import { useWaveData } from '@/hooks/useWaveData';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>
      {children}
    </div>
  ),
}));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('@/hooks/useWaveData', () => ({
  useWaveData: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseWaveData = useWaveData as jest.Mock;

const renderWithQueryClient = (ui: ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('BrainLeftSidebarWaveClose', () => {
  const push = jest.fn();
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    mockedUseWaveData.mockReturnValue({
      data: {
        chat: {
          scope: {
            group: {
              is_direct_message: false,
            },
          },
        },
      },
    });
    jest.clearAllMocks();
  });

  it('renders button with icon', () => {
    renderWithQueryClient(<BrainLeftSidebarWaveClose waveId="1" />);
    expect(screen.getByRole('button', { name: /close wave/i })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-wave-close-1')).toBeInTheDocument();
  });

  it('navigates to /my-stream on click', async () => {
    renderWithQueryClient(<BrainLeftSidebarWaveClose waveId="1" />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(push).toHaveBeenCalledWith('/waves');
  });
});
