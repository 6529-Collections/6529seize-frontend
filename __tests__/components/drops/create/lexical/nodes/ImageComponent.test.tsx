import { render, screen, fireEvent } from '@testing-library/react';
import ImageComponent from '../../../../../../components/drops/create/lexical/nodes/ImageComponent';
import CircleLoader, { CircleLoaderSize } from '../../../../../../components/distribution-plan-tool/common/CircleLoader';

jest.mock('../../../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="loader" />),
  CircleLoaderSize: { MEDIUM: 'MEDIUM' }
}));

describe('ImageComponent', () => {
  it('renders loader when src is "loading"', () => {
    render(<ImageComponent src="loading" />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('calculates dimensions when width and height are not provided', () => {
    render(<ImageComponent src="img.png" altText="img" />);
    const img = screen.getByRole('img', { name: 'img' }) as HTMLImageElement;

    Object.defineProperty(img, 'naturalWidth', { value: 1200 });
    Object.defineProperty(img, 'naturalHeight', { value: 600 });
    fireEvent.load(img);

    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '400');
  });

  it('respects provided width and computes height', () => {
    render(<ImageComponent src="foo.jpg" altText="foo" width={200} />);
    const img = screen.getByRole('img', { name: 'foo' }) as HTMLImageElement;

    Object.defineProperty(img, 'naturalWidth', { value: 600 });
    Object.defineProperty(img, 'naturalHeight', { value: 300 });
    fireEvent.load(img);

    expect(img).toHaveAttribute('width', '200');
    expect(img).toHaveAttribute('height', '100');
  });
});
