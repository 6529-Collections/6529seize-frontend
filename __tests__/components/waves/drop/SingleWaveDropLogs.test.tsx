import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleWaveDropLogs } from '../../../../components/waves/drop/SingleWaveDropLogs';
import { useWaveActivityLogs } from '../../../../hooks/useWaveActivityLogs';
import { useAuth } from '../../../../components/auth/Auth';
import { useIntersectionObserver } from '../../../../hooks/useIntersectionObserver';

jest.mock('../../../../hooks/useWaveActivityLogs');
jest.mock('../../../../components/auth/Auth');
jest.mock('../../../../hooks/useIntersectionObserver');
jest.mock('../../../../components/waves/drop/SingleWaveDropLog', () => ({ SingleWaveDropLog: (p:any) => <div data-testid="log">{p.log.id}</div> }));

const useWaveActivityLogsMock = useWaveActivityLogs as jest.Mock;
(useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });
(useIntersectionObserver as jest.Mock).mockReturnValue({ current: null });

const drop = { id:'d1', wave:{id:'w', voting_credit_type:0} } as any;

test('toggles logs display', async () => {
  const user = userEvent.setup();
  useWaveActivityLogsMock.mockReturnValue({ logs:[{id:'1'}], isFetchingNextPage:false, fetchNextPage:jest.fn(), hasNextPage:false, isLoading:false });
  render(<SingleWaveDropLogs drop={drop} />);
  expect(screen.queryByTestId('log')).toBeNull();
  await user.click(screen.getByRole('button'));
  expect(screen.getByTestId('log')).toBeInTheDocument();
});
