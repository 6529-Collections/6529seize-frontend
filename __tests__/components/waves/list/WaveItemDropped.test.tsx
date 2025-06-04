import { render, screen } from '@testing-library/react';
import WaveItemDropped from '../../../../components/waves/list/WaveItemDropped';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('../../../../helpers/Helpers', () => ({ numberWithCommas: (n: number) => n.toString() }));
jest.mock('../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => `scaled-${u}`, ImageScale: { W_AUTO_H_50: 'scale' } }));

const wave: any = {
  metrics: { drops_count: 2 },
  contributors_overview: [
    { contributor_identity: 'a', contributor_pfp: 'a.png' },
    { contributor_identity: 'b', contributor_pfp: 'b.png' },
    { contributor_identity: 'c', contributor_pfp: 'c.png' },
    { contributor_identity: 'd', contributor_pfp: 'd.png' },
    { contributor_identity: 'e', contributor_pfp: 'e.png' },
    { contributor_identity: 'f', contributor_pfp: 'f.png' },
  ]
};

test('renders first five contributor avatars and plural text', () => {
  render(<WaveItemDropped wave={wave} />);
  const imgs = screen.getAllByRole('img');
  expect(imgs).toHaveLength(5); // only first five
  expect(imgs[0]).toHaveAttribute('src', 'scaled-a.png');
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Drops')).toBeInTheDocument();
});

test('uses singular label when one drop', () => {
  const single = { ...wave, metrics: { drops_count: 1 } } as any;
  render(<WaveItemDropped wave={single} />);
  expect(screen.getByText('Drop')).toBeInTheDocument();
});
