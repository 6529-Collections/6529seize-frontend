import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WavePodiumItem } from '../../../../../components/waves/winners/podium/WavePodiumItem';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => `scaled:${u}`, ImageScale: { W_AUTO_H_50: 'x' } }));
jest.mock('../../../../../components/waves/winners/podium/WavePodiumItemContentOutcomes', () => ({ WavePodiumItemContentOutcomes: () => <div data-testid='outcomes'/> }));
jest.mock('../../../../../components/waves/winners/podium/WaveWinnersPodiumPlaceholder', () => ({ WaveWinnersPodiumPlaceholder: (props: any) => <div data-testid='placeholder' data-position={props.position}/> }));

const drop: any = {
  author: { handle: 'alice', pfp: 'pfp.png' },
  rating: 5,
  raters_count: 1,
  wave: { voting_credit_type: 'CIC' },
  parts: [],
  metadata: []
};

it('renders placeholder when no winner', () => {
  render(<WavePodiumItem position='second' onDropClick={jest.fn()} />);
  expect(screen.getByTestId('placeholder')).toHaveAttribute('data-position','second');
});

it('calls onDropClick when clicked', () => {
  const onDropClick = jest.fn();
  render(<WavePodiumItem winner={{ drop } as any} position='first' onDropClick={onDropClick} />);
  fireEvent.click(screen.getByRole('link', { name: /alice/i }).parentElement!.parentElement!.parentElement!.parentElement!);
  expect(onDropClick).toHaveBeenCalledWith(drop);
});
