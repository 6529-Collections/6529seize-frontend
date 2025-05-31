import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropActionsOpen from '../../../../components/waves/drops/WaveDropActionsOpen';
import { ApiDropType } from '../../../../generated/models/ApiDropType';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

afterEach(() => jest.clearAllMocks());

test('returns null for chat drops', () => {
  const drop = { id:'1', drop_type: ApiDropType.Chat } as any;
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), pathname:'/', query:{} });
  const { container } = render(<WaveDropActionsOpen drop={drop} />);
  expect(container.firstChild).toBeNull();
});

test('pushes route on click', async () => {
  const user = userEvent.setup();
  const push = jest.fn();
  const drop = { id:'2', drop_type: ApiDropType.Winner } as any;
  (useRouter as jest.Mock).mockReturnValue({ push, pathname:'/wave', query:{} });
  render(<WaveDropActionsOpen drop={drop} />);
  await user.click(screen.getByRole('button'));
  expect(push).toHaveBeenCalled();
});
