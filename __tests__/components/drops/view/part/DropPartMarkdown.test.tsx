import { render, screen } from '@testing-library/react';
import DropPartMarkdown from '../../../../../components/drops/view/part/DropPartMarkdown';

jest.mock('../../../../../hooks/isMobileScreen', () => () => false);
jest.mock('../../../../../contexts/EmojiContext', () => ({ useEmoji: () => ({ emojiMap: [] }) }));
jest.mock('react-tweet', () => ({ Tweet: ({ id }: any) => <div>tweet:{id}</div> }));
jest.mock('link-preview-js', () => ({
  getLinkPreview: jest.fn().mockResolvedValue({
    url: 'https://google.com',
    title: 'Google',
    description: 'Search',
    siteName: 'Google',
    mediaType: 'website',
    contentType: 'text/html',
    images: ['img.jpg'],
    videos: [],
    favicons: []
  })
}));

describe('DropPartMarkdown', () => {
  it('renders gif embeds', () => {
    const content = 'Check this ![gif](https://media.tenor.com/test.gif)';
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://media.tenor.com/test.gif');
  });

  it('handles external links', async () => {
    process.env.BASE_ENDPOINT = 'http://example.com';
    const content = '[link](https://google.com)';
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel');
    expect(await screen.findByText('Google')).toBeInTheDocument();
  });

  it('handles internal links', async () => {
    process.env.BASE_ENDPOINT = 'http://example.com';
    const content = '[home](http://example.com/page)';
    render(
      <DropPartMarkdown
        mentionedUsers={[]}
        referencedNfts={[]}
        partContent={content}
        onQuoteClick={jest.fn()}
      />
    );
    const a = screen.getByRole('link');
    expect(a).not.toHaveAttribute('target');
    expect(a).toHaveAttribute('href', '/page');
    expect(await screen.findByText('Google')).toBeInTheDocument();
  });
});
