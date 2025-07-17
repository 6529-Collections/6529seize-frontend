import { render, screen } from '@testing-library/react';
import {
  NextGenTokenImage,
  getNextGenImageUrl,
  getNextGenIconUrl,
  get8KUrl,
  get16KUrl,
} from '../../../components/nextGen/collections/nextgenToken/NextGenTokenImage';

jest.mock('next/image', () => ({ __esModule: true, default: ({ priority, ...props }: any) => <img {...props} /> }));


jest.mock('../../../hooks/isMobileScreen', () => ({ __esModule: true, default: () => false }));
jest.mock('../../../components/user/utils/UserCICAndLevel', () => ({ __esModule: true, default: () => <div data-testid='cic' /> }));

const baseToken: any = {
  id: 1,
  normalised_id: 1,
  name: 'token',
  image_url: 'img.png',
  thumbnail_url: 'thumb.png',
  animation_url: 'anim.html',
  owner: '0x1',
  level: 1,
  tdh: 0,
  rep_score: 0,
  opensea_price: 0,
  blur_price: 0,
  me_price: 0,
};

test('renders iframe when animation shown', () => {
  render(<NextGenTokenImage token={baseToken} show_animation hide_link />);
  const frame = screen.getByTitle('token');
  expect(frame).toHaveAttribute('src', 'anim.html');
});

test('shows owner info button', () => {
  render(<NextGenTokenImage token={baseToken} show_owner_info hide_link />);
  expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();
});

test('shows listing info with royalty image', () => {
  const token = { ...baseToken, price: 1, opensea_price: 1, opensea_royalty: 500 };
  render(<NextGenTokenImage token={token} show_listing hide_link />);
  expect(screen.getByText(/Listed for/)).toBeInTheDocument();
  expect(screen.getByAltText('pepe')).toBeInTheDocument();
});


test('helper url generators', () => {
  expect(getNextGenImageUrl(5)).toContain('/png/5');
  expect(getNextGenIconUrl(5)).toContain('/thumbnail/5');
  expect(get8KUrl(5)).toContain('/png8k/5');
  expect(get16KUrl(5)).toContain('/png16k/5');
});
