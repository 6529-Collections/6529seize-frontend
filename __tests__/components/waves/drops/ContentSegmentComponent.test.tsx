import React from 'react';
import { render, screen } from '@testing-library/react';
import ContentSegmentComponent from '../../../../components/waves/drops/ContentSegmentComponent';

jest.mock('../../../../components/waves/drops/MediaThumbnail', () => (props: any) => <div data-testid="thumb">{props.media.url}</div>);

describe('ContentSegmentComponent', () => {
  it('renders text segment', () => {
    render(<ContentSegmentComponent segment={{ type: 'text', content: 'hello' }} index={0} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders media segment', () => {
    render(<ContentSegmentComponent segment={{ type: 'media', mediaInfo: { url: 'x' } }} index={1} />);
    expect(screen.getByTestId('thumb')).toHaveTextContent('x');
  });

  it('returns null for unknown segment', () => {
    const { container } = render(<ContentSegmentComponent segment={{ type: 'media' }} index={2} />);
    expect(container.firstChild).toBeNull();
  });
});
