import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropQuote from '../../../../components/waves/drops/WaveDropQuote';

jest.mock('../../../../components/drops/view/part/DropPartMarkdownWithPropLogger', () => (props: any) => <div data-testid="markdown">{props.partContent}</div>);
jest.mock('../../../../components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
  UserCICAndLevelSize: { SMALL: 'SMALL' }
}));
jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

test('renders placeholder when drop missing', () => {
  const { container } = render(<WaveDropQuote drop={null} partId={1} onQuoteClick={jest.fn()} />);
  expect(container.querySelector('.tw-animate-pulse')).toBeInTheDocument();
});

test('calls onQuoteClick on interaction', async () => {
  const drop = { id: 'd1', wave: { id: 'w1', name:'wave' }, author: { handle:'a', level:1, cic:'BRONZE', pfp:null }, parts:[{ part_id:1, content:'hello' }], created_at:'2020-01-01', mentioned_users:[], referenced_nfts:[] } as any;
  const onQuoteClick = jest.fn();
  render(<WaveDropQuote drop={drop} partId={1} onQuoteClick={onQuoteClick} />);
  await userEvent.click(screen.getByRole('button'));
  expect(onQuoteClick).toHaveBeenCalledWith(drop);
});

test('displays quoted part content', () => {
  const drop = { id: 'd1', wave: { id: 'w1', name:'wave' }, author:{ handle:'a', level:1, cic:'BRONZE', pfp:null }, parts:[{ part_id:5, content:'text' }], created_at:'2020-01-01', mentioned_users:[], referenced_nfts:[] } as any;
  render(<WaveDropQuote drop={drop} partId={5} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId('markdown')).toHaveTextContent('text');
});
