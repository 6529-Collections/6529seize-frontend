import { render } from '@testing-library/react';
import PepeWTFIcon from '../../../../../components/user/utils/icons/PepeWTFIcon';

test('renders img with correct attributes', () => {
  const { container } = render(<PepeWTFIcon />);
  const img = container.querySelector('img') as HTMLImageElement;
  expect(img).toHaveAttribute('src', '/pepewtf.png');
  expect(img).toHaveAttribute('alt', 'pepe wtf');
  expect(img.className).toContain('tw-object-contain');
});
