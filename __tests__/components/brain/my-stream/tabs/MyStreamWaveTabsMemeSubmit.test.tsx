import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamWaveTabsMemeSubmit from '@/components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit';
import { SubmissionStatus } from '@/hooks/useWave';

const useWave = jest.fn();
const useCountdown = jest.fn();

jest.mock('@/hooks/useWave', () => ({
  useWave: (...args: any[]) => useWave(...args),
  SubmissionStatus: jest.requireActual('../../../../../hooks/useWave').SubmissionStatus,
}));

jest.mock('@/hooks/useCountdown', () => ({
  useCountdown: (...args: any[]) => useCountdown(...args),
}));

jest.mock('@/components/utils/button/PrimaryButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button data-testid="primary" {...props}>{children}</button>,
}));

jest.mock('@/components/utils/button/InfoButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button data-testid="info" {...props}>{children}</button>,
}));

jest.mock('@/components/utils/button/ClosedButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button data-testid="closed" {...props}>{children}</button>,
}));

jest.mock('@/components/utils/icons/ClockIcon', () => ({ __esModule: true, default: () => <svg data-testid="clock" /> }));
jest.mock('@/components/utils/icons/CalendarClosedIcon', () => ({ __esModule: true, default: () => <svg data-testid="calendar" /> }));
jest.mock('@/components/utils/icons/LimitIcon', () => ({ __esModule: true, default: () => <svg data-testid="limit" /> }));
jest.mock('@/components/utils/icons/PermissionIcon', () => ({ __esModule: true, default: () => <svg data-testid="permission" /> }));

const baseInfo = {
  voting: {},
  chat: {},
  decisions: {},
  isChatWave: false,
  isRankWave: false,
  isMemesWave: true,
  isDm: false,
} as any;

const wave = { id: 'w1' } as any;

function renderComponent(info: any) {
  useWave.mockReturnValue(info);
  return render(<MyStreamWaveTabsMemeSubmit wave={wave} handleMemesSubmit={() => {}} />);
}

describe('MyStreamWaveTabsMemeSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCountdown.mockReturnValue('soon');
  });

  it('renders closed state', () => {
    const now = Date.now();
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ENDED,
        startTime: now - 1000,
        endTime: now - 500,
      },
    });
    expect(screen.getByTestId('closed')).toHaveAttribute('title', expect.stringContaining('Submissions closed'));
    expect(screen.getByText('Submissions Closed')).toBeInTheDocument();
  });

  it('renders coming soon state', () => {
    const now = Date.now();
    useCountdown.mockReturnValue('in 1h');
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.NOT_STARTED,
        startTime: now + 3600,
        endTime: now + 7200,
      },
    });
    expect(screen.getByTestId('info')).toHaveAttribute('title', expect.stringContaining('Submissions open'));
    expect(screen.getByText('Submissions Open in 1h')).toBeInTheDocument();
  });

  it('renders not eligible state', () => {
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ACTIVE,
        isEligible: false,
        startTime: 0,
        endTime: 0,
      },
    });
    expect(screen.getByTestId('info')).toHaveAttribute('title', expect.stringContaining("don't have permission"));
    expect(screen.getByText('Not Eligible to Submit')).toBeInTheDocument();
  });

  it('renders limit reached state', () => {
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ACTIVE,
        isEligible: true,
        hasReachedLimit: true,
        maxSubmissions: 2,
        startTime: 0,
        endTime: 0,
      },
    });
    expect(screen.getByTestId('info')).toHaveAttribute('title', expect.stringContaining('maximum'));
    expect(screen.getByText('Submission Limit Reached (2)')).toBeInTheDocument();
  });

  it('renders active state with urgency and remaining badge', () => {
    const now = Date.now();
    useCountdown.mockReturnValueOnce('3h').mockReturnValueOnce('3h');
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ACTIVE,
        isEligible: true,
        hasReachedLimit: false,
        remainingSubmissions: 2,
        maxSubmissions: 5,
        canSubmitNow: true,
        isWithinPeriod: true,
        startTime: now - 1000,
        endTime: now + 3 * 60 * 60 * 1000,
      },
    });
    const button = screen.getByTestId('primary');
    expect(button).toHaveAttribute('title', expect.stringContaining('You have'));
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Submit Meme')).toBeInTheDocument();
    expect(screen.getByText('Closing 3h')).toBeInTheDocument();
    expect(screen.getByText('2 Left')).toBeInTheDocument();
  });
});
