import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainLeftSidebarWaveClose from '../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWaveClose';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tippyjs/react', () => (props: any) => <div data-testid="tippy">{props.children}</div>);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));

const mockedUseRouter = useRouter as jest.Mock;

describe('BrainLeftSidebarWaveClose', () => {
  const push = jest.fn();
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    jest.clearAllMocks();
  });

  it('renders button with icon', () => {
    render(<BrainLeftSidebarWaveClose waveId="1" />);
    expect(screen.getByRole('button', { name: /close wave/i })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('tippy')).toBeInTheDocument();
  });

  it('navigates to /my-stream on click', async () => {
    render(<BrainLeftSidebarWaveClose waveId="1" />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(push).toHaveBeenCalledWith('/my-stream', undefined, { shallow: true });
  });
});
