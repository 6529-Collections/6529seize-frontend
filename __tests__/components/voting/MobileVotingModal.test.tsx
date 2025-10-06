import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MobileVotingModal from '@/components/voting/MobileVotingModal';

jest.mock('@/components/waves/drop/SingleWaveDropVote', () => ({
  __esModule: true,
  SingleWaveDropVote: (props: any) => (
    <button data-testid="vote" onClick={props.onVoteSuccess} />
  )
}));

jest.mock('@/components/mobile-wrapper-dialog/MobileWrapperDialog', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="dialog" onClick={props.onClose}>{props.isOpen ? 'open' : 'closed'}{props.children}</div>
  )
}));

describe('MobileVotingModal', () => {
  const drop = { id: 'd' } as any;

  it('closes via dialog close', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MobileVotingModal drop={drop} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByTestId('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when vote succeeds', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MobileVotingModal drop={drop} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByTestId('vote'));
    expect(onClose).toHaveBeenCalled();
  });
});
