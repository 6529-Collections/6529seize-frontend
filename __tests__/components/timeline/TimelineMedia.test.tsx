import { render, screen } from '@testing-library/react';
import TimelineMedia, { MediaType } from '../../../components/timeline/TimelineMedia';

jest.mock('../../../components/timeline/Timeline.module.scss', () => ({ timelineMediaImage: 'media' }));

describe('TimelineMedia', () => {
  it('renders image element by default', () => {
    render(<TimelineMedia url="img.png" type={MediaType.IMAGE} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveClass('media');
  });

  it('renders video when type VIDEO', () => {
    const { container } = render(<TimelineMedia url="video.mp4" type={MediaType.VIDEO} />);
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', 'video.mp4');
  });

  it('renders iframe when type HTML', () => {
    const { container } = render(<TimelineMedia url="page.html" type={MediaType.HTML} />);
    const frame = container.querySelector('iframe');
    expect(frame).toHaveAttribute('src', 'page.html');
  });
});
