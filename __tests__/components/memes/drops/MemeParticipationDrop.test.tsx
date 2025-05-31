import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeParticipationDrop from '../../../../components/memes/drops/MemeParticipationDrop';
import { DropLocation } from '../../../../components/waves/drops/Drop';
import { useDropInteractionRules } from '../../../../hooks/drops/useDropInteractionRules';
import useIsMobileDevice from '../../../../hooks/isMobileDevice';
import useIsMobileScreen from '../../../../hooks/isMobileScreen';

jest.mock('../../../../hooks/drops/useDropInteractionRules');
jest.mock('../../../../hooks/isMobileDevice');
jest.mock('../../../../hooks/isMobileScreen');

jest.mock('../../../../components/memes/drops/meme-participation-drop/MemeDropHeader', () => (props:any) => <div data-testid="header">{props.title}</div>);
jest.mock('../../../../components/memes/drops/meme-participation-drop/MemeDropDescription', () => (props:any) => <div>{props.description}</div>);
jest.mock('../../../../components/memes/drops/meme-participation-drop/MemeDropVoteStats', () => () => <div data-testid="stats" />);
jest.mock('../../../../components/memes/drops/meme-participation-drop/MemeDropArtistInfo', () => () => <div data-testid="artist" />);
jest.mock('../../../../components/memes/drops/meme-participation-drop/MemeDropActions', () => () => <div data-testid="actions" />);
jest.mock('../../../../components/memes/drops/MemeDropTraits', () => () => <div data-testid="traits" />);
jest.mock('../../../../components/waves/drops/DropMobileMenuHandler', () => (props:any) => <div data-testid="handler" onClick={() => {props.onReply({}); props.onQuote({});}}>{props.children}</div>);
jest.mock('../../../../components/voting', () => ({ VotingModal: () => <div data-testid="modal" />, MobileVotingModal: () => <div data-testid="mobile" /> }));
jest.mock('../../../../components/voting/VotingModalButton', () => (props:any) => <button data-testid="vote" onClick={props.onClick} />);

const rules = useDropInteractionRules as jest.Mock;
(useIsMobileDevice as jest.Mock).mockReturnValue(false);
(useIsMobileScreen as jest.Mock).mockReturnValue(false);

describe('MemeParticipationDrop', () => {
  const drop: any = { id:'1', rank:1, parts:[{part_id:'p', media:[{mime_type:'img', url:'u'}]}], metadata:[], rating:1, rating_prediction:2, raters_count:0, wave:{ voting_credit_type:'A' } };

  it('renders voting modal variant based on screen size', () => {
    rules.mockReturnValue({ canShowVote:true });
    const { rerender } = render(
      <MemeParticipationDrop drop={drop} activeDrop={null} showReplyAndQuote location={DropLocation.FEED} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    (useIsMobileScreen as jest.Mock).mockReturnValue(true);
    rerender(
      <MemeParticipationDrop drop={drop} activeDrop={null} showReplyAndQuote location={DropLocation.FEED} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    expect(screen.getByTestId('mobile')).toBeInTheDocument();
  });

  it('adds active border class when active', () => {
    rules.mockReturnValue({ canShowVote:false });
    const { container } = render(
      <MemeParticipationDrop drop={drop} activeDrop={{ drop }} showReplyAndQuote location={DropLocation.FEED} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    expect(container.querySelector('[class*="tw-bg-[#3CCB7F]/5"]')).toBeTruthy();
  });
});
