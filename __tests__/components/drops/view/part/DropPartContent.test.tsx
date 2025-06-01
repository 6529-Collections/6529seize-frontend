import { render, screen } from '@testing-library/react';
import DropPartContent from '../../../../../components/drops/view/part/DropPartContent';

jest.mock('../../../../../components/drops/view/part/DropPartMarkdown', () => ({ __esModule: true, default: () => <div data-testid="markdown" /> }));
jest.mock('../../../../../components/drops/view/item/content/media/DropListItemContentMedia', () => ({ __esModule: true, default: (props:any) => <div data-testid="media" data-src={props.media_url} /> }));

const baseProps = {
  mentionedUsers: [],
  referencedNfts: [],
  partContent: 'text',
  onQuoteClick: jest.fn(),
  currentPartCount: 1,
};

it('renders markdown and medias', () => {
  render(<DropPartContent {...baseProps} partMedias={[{mimeType:'image/png', mediaSrc:'u'}]} />);
  expect(screen.getByTestId('markdown')).toBeInTheDocument();
  expect(screen.getByTestId('media')).toHaveAttribute('data-src','u');
});

it('omits media container when none', () => {
  const { container } = render(<DropPartContent {...baseProps} partMedias={[]} />);
  expect(container.querySelectorAll('[data-testid="media"]').length).toBe(0);
});
