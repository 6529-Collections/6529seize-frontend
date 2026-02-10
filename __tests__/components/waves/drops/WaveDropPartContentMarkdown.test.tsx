import React from 'react';
import { render, screen } from '@testing-library/react';
import WaveDropPartContentMarkdown from '@/components/waves/drops/WaveDropPartContentMarkdown';

jest.mock('@/components/drops/view/part/DropPartMarkdownWithPropLogger', () => (props: any) => <div data-testid='md'>{props.partContent}</div>);
jest.mock('@/components/waves/drops/WaveDropQuoteWithDropId', () => (props: any) => <div data-testid='quote' data-id={props.dropId} data-part={props.partId}/>);

const basePart: any = { content: 'hello', quoted_drop: null };
const wave: any = { id: 'w' };

it('renders markdown only', () => {
  render(<WaveDropPartContentMarkdown mentionedUsers={[]} referencedNfts={[]} part={basePart} wave={wave} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId('md')).toHaveTextContent('hello');
  expect(screen.queryByTestId('quote')).toBeNull();
});

it('renders quoted drop', () => {
  const part = { content: 'c', quoted_drop: { drop_id: 'd', drop_part_id: 1, drop: null } } as any;
  render(<WaveDropPartContentMarkdown mentionedUsers={[]} referencedNfts={[]} part={part} wave={wave} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId('quote')).toHaveAttribute('data-id','d');
});
