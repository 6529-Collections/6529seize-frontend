import { render } from '@testing-library/react';
import DecaArtIcon from '@/components/user/utils/icons/DecaArtIcon';

describe('DecaArtIcon', () => {
  it('renders image with alt text', () => {
    const { container } = render(<DecaArtIcon />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/Deca-art-icon.jpg');
    expect(img).toHaveAttribute('alt', 'Deca Art');
  });
});
