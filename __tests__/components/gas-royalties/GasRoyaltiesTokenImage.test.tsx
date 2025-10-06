import { render } from '@testing-library/react';
import { GasRoyaltiesTokenImage } from '@/components/gas-royalties/GasRoyalties';

// Mock next/image to render a regular img element
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id, content }: any) => (
    <div data-testid={`tooltip-${id}`}>
      {content || children}
    </div>
  ),
}));

describe('GasRoyaltiesTokenImage', () => {
  it('renders link with token image', () => {
    const { container } = render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={1}
        name="Meme1"
        thumbnail="img.png"
      />
    );
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/memes/1');
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Meme1');
    expect(img).toHaveAttribute('src', 'img.png');
  });

  it('shows note when provided', () => {
    const { container } = render(
      <GasRoyaltiesTokenImage
        path="memes"
        token_id={2}
        name="Meme2"
        thumbnail="img.png"
        note="Important"
      />
    );
    // Check that the tooltip with note is rendered
    expect(container.querySelector('[data-testid="tooltip-token-info-2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="tooltip-token-info-2"]').textContent).toContain('Important');
  });
});
