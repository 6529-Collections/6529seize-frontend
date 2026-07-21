import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingModal from '@/components/voting/VotingModal';
import { SingleWaveDropVoteSubmissionMode } from '@/components/waves/drop/SingleWaveDropVote.types';

jest.mock('@/components/waves/drop/SingleWaveDropVote', () => {
  const MockSingleWaveDropVote = (props: any) => (
    <button
      data-testid="vote"
      data-has-request-started={String(
        typeof props.onVoteRequestStarted === 'function'
      )}
      data-has-success={String(typeof props.onVoteSuccess === 'function')}
      data-submission-mode={props.submissionMode}
      onClick={props.onVoteRequestStarted}
    />
  );
  MockSingleWaveDropVote.displayName = 'MockSingleWaveDropVote';
  return { SingleWaveDropVote: MockSingleWaveDropVote };
});

jest.mock('@/components/waves/memes/submission/layout/ModalLayout', () => {
  const MockModalLayout = (props: any) => (
    <div data-testid="layout">
      <button onClick={props.onCancel}>Cancel</button>
      {props.children}
    </div>
  );
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

  it('passes background submission mode to vote content', () => {
    render(<VotingModal drop={drop} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toHaveClass(
      'tw-z-1000',
      'tw-bg-gray-700/75'
    );
    expect(screen.getByTestId('vote')).toHaveAttribute(
      'data-submission-mode',
      SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
    );
    expect(screen.getByTestId('vote')).toHaveAttribute(
      'data-has-request-started',
      'true'
    );
    expect(screen.getByTestId('vote')).toHaveAttribute(
      'data-has-success',
      'false'
    );
  });

  it('closes when vote request starts', () => {
    const onClose = jest.fn();
    render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('vote'));
    expect(onClose).toHaveBeenCalled();
  });
});
