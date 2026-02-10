import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingModal from '@/components/voting/VotingModal';

jest.mock('@/components/waves/drop/SingleWaveDropVote', () => {
  const MockSingleWaveDropVote = (props: any) => <button data-testid="vote" onClick={props.onVoteSuccess} />;
  MockSingleWaveDropVote.displayName = 'MockSingleWaveDropVote';
  return { SingleWaveDropVote: MockSingleWaveDropVote };
});

jest.mock('@/components/waves/memes/submission/layout/ModalLayout', () => {
  const MockModalLayout = (props: any) => <div data-testid="layout">{props.children}</div>;
  MockModalLayout.displayName = 'MockModalLayout';
  return MockModalLayout;
});

jest.mock('@/components/utils/button/SecondaryButton', () => {
  const MockSecondaryButton = (props: any) => <button onClick={props.onClicked}>{props.children}</button>;
  MockSecondaryButton.displayName = 'MockSecondaryButton';
  return MockSecondaryButton;
});

describe('VotingModal', () => {
  const drop = { id: 'd' } as any;

  it('returns null when closed', () => {
    const { container } = render(
      <VotingModal drop={drop} isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('closes when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when vote succeeds', () => {
    const onClose = jest.fn();
    render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('vote'));
    expect(onClose).toHaveBeenCalled();
  });
});
