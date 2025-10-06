import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentDisplay from '@/components/waves/drops/ContentDisplay';

let segmentProps: any[] = [];
jest.mock('@/components/waves/drops/ContentSegmentComponent', () =>
  (props: any) => { segmentProps.push(props); return <div data-testid={`segment-${props.index}`}>{props.segment.content}</div>; });

jest.mock('@/components/waves/drops/MediaThumbnail', () =>
  (props: any) => <div data-testid={`media-${props.media.url}`} />);

describe('ContentDisplay', () => {
  beforeEach(() => { segmentProps = []; });
  const content = {
    segments: [
      { type: 'text', content: 'hello' },
      { type: 'text', content: 'world' }
    ],
    apiMedia: [
      { url: 'img1', mime_type: 'image/png', alt: '', type: 'image' },
      { url: 'img2', mime_type: 'image/png', alt: '', type: 'image' }
    ]
  } as any;

  it('calls onReplyClick when clicked with serial number', async () => {
    const onReplyClick = jest.fn();
    render(<ContentDisplay content={content} onReplyClick={onReplyClick} serialNo={5} />);
    await userEvent.click(screen.getByText('hello').closest('span')!);
    expect(onReplyClick).toHaveBeenCalledWith(5);
  });

  it('does not call onReplyClick without serial number', async () => {
    const onReplyClick = jest.fn();
    render(<ContentDisplay content={content} onReplyClick={onReplyClick} />);
    await userEvent.click(screen.getByText('world').closest('span')!);
    expect(onReplyClick).not.toHaveBeenCalled();
  });

  it('renders all segments and media', () => {
    render(<ContentDisplay content={content} onReplyClick={jest.fn()} />);
    expect(segmentProps).toHaveLength(2);
    expect(screen.getByTestId('media-img1')).toBeInTheDocument();
    expect(screen.getByTestId('media-img2')).toBeInTheDocument();
  });
});
