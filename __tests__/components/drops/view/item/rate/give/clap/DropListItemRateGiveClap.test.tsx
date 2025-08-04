import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DropListItemRateGiveClap from '../../../../../../../../components/drops/view/item/rate/give/clap/DropListItemRateGiveClap';
import { DropVoteState } from '../../../../../../../../hooks/drops/types';

const mockReplay = jest.fn();
const mockAdd = jest.fn();

jest.mock('@mojs/core', () => ({
  __esModule: true,
  default: {
    Burst: jest.fn().mockImplementation(() => ({ tune: jest.fn() })),
    Html: jest.fn().mockImplementation(() => ({ then: jest.fn().mockReturnThis(), tune: jest.fn() })),
    Timeline: jest.fn().mockImplementation(() => ({ add: mockAdd, replay: mockReplay })),
    easing: { bezier: jest.fn(), out: jest.fn() },
  },
}));

jest.mock('../../../../../../../../helpers/AllowlistToolHelpers', () => ({
  getRandomObjectId: () => 'id123',
}));

jest.mock('../../../../../../../../helpers/Helpers', () => ({
  formatLargeNumber: jest.fn((num) => {
    const absNum = Math.abs(num);
    if (absNum < 1000) {
      return absNum.toLocaleString('en-US');
    } else if (absNum < 10000) {
      const value = absNum / 1000;
      if (value % 1 === 0) {
        return `${value.toLocaleString('en-US')}K`;
      } else {
        return `${value.toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}K`;
      }
    } else if (absNum < 1000000) {
      const value = absNum / 1000;
      return `${value.toLocaleString('en-US')}K`;
    } else {
      const value = absNum / 1000000;
      if (value % 1 === 0) {
        return `${value.toLocaleString('en-US')}M`;
      } else {
        return `${value.toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}M`;
      }
    }
  }),
}));

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));

describe('DropListItemRateGiveClap', () => {
  it('triggers animation and submit on click when voting positive', async () => {
    const onSubmit = jest.fn();
    render(
      <DropListItemRateGiveClap rate={5} voteState={DropVoteState.CAN_VOTE} canVote onSubmit={onSubmit} />
    );
    await waitFor(() => expect(mockAdd).toHaveBeenCalled());
    const button = screen.getByRole('button', { name: /clap for drop/i });
    fireEvent.click(button);
    expect(mockReplay).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    expect(button.className).toContain('clapPositive');
  });

  it('does not submit when user cannot vote', async () => {
    const onSubmit = jest.fn();
    render(
      <DropListItemRateGiveClap rate={5} voteState={DropVoteState.NO_PROFILE} canVote={false} onSubmit={onSubmit} />
    );
    const button = await screen.findByRole('button', { name: /clap for drop/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(button.className).not.toContain('clapPositive');
  });

  it('formats large numbers and sets size classes', async () => {
    render(
      <DropListItemRateGiveClap rate={1500} voteState={DropVoteState.CAN_VOTE} canVote onSubmit={() => {}} />
    );
    const count = await screen.findByText('+1.5K');
    expect(count.className).toContain('tw-w-9 tw-h-9 tw-left-[6px]');
  });
});
