import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingModal from '../../../components/voting/VotingModal';

jest.mock('../../../components/waves/drop/SingleWaveDropVote', () => ({ SingleWaveDropVote: (props: any) => <button data-testid='vote' onClick={props.onVoteSuccess}/> }));
jest.mock('../../../components/waves/memes/submission/layout/ModalLayout', () => (props: any) => <div data-testid='layout'>{props.children}</div>);
jest.mock('../../../components/utils/button/SecondaryButton', () => (props: any) => <button onClick={props.onClicked}>{props.children}</button>);

const drop = { id: 'd' } as any;

test('returns null when closed', () => {
  const { container } = render(<VotingModal drop={drop} isOpen={false} onClose={jest.fn()} />);
  expect(container.firstChild).toBeNull();
});

test('closes when overlay or cancel clicked', () => {
  const onClose = jest.fn();
  render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
  fireEvent.click(screen.getByText('Cancel'));
  expect(onClose).toHaveBeenCalled();
});

 test('closes when vote succeeds', () => {
  const onClose = jest.fn();
  render(<VotingModal drop={drop} isOpen={true} onClose={onClose} />);
  fireEvent.click(screen.getByTestId('vote'));
  expect(onClose).toHaveBeenCalled();
 });

