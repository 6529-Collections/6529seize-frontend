import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MemeWinnerDrop from '../../../../components/memes/drops/MemeWinnerDrop';

jest.mock('../../../../hooks/isMobileDevice', () => jest.fn(() => false));
jest.mock('../../../../components/waves/drops/WaveDropActions', () => (props: any) => (
  <button data-testid='reply' onClick={() => props.onReply({})} />
));
jest.mock('../../../../components/memes/drops/MemeWinnerHeader', () => (props: any) => <div>{props.title}</div>);
jest.mock('../../../../components/memes/drops/MemeWinnerDescription', () => (props: any) => <p>{props.description}</p>);
jest.mock('../../../../components/memes/drops/MemeWinnerArtistInfo', () => () => <div data-testid='artist'/>);
jest.mock('../../../../components/memes/drops/MemeDropTraits', () => () => <div data-testid='traits'/>);
jest.mock('../../../../components/waves/drops/DropMobileMenuHandler', () => (props: any) => <div>{props.children}</div>);
jest.mock('../../../../components/drops/view/item/content/media/DropListItemContentMedia', () => (props: any) => <img data-testid='media' src={props.media_url}/>);

jest.mock('../../../../components/waves/drops/DropContext', () => ({ useDropContext: () => ({ location: 'WAVE' }) }));

const drop: any = { parts: [{ part_id:1, media:[{ url:'u', mime_type:'image/png'}] }], metadata: [] , author:{}, wave:{} };

test('renders actions on desktop', () => {
  const onReply = jest.fn();
  render(<MemeWinnerDrop drop={drop} showReplyAndQuote onReply={onReply} onQuote={jest.fn()} />);
  fireEvent.click(screen.getByTestId('reply'));
  expect(onReply).toHaveBeenCalled();
});

test('hides actions when mobile', () => {
  const useMobile = require('../../../../hooks/isMobileDevice');
  (useMobile as jest.Mock).mockReturnValue(true);
  const { queryByTestId } = render(<MemeWinnerDrop drop={drop} showReplyAndQuote onReply={jest.fn()} onQuote={jest.fn()} />);
  expect(queryByTestId('reply')).toBeNull();
});
