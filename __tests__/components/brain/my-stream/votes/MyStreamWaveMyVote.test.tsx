import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MyStreamWaveMyVote from '@/components/brain/my-stream/votes/MyStreamWaveMyVote';

jest.mock('@/components/drops/view/item/content/media/DropListItemContentMedia', () => ({
  __esModule: true,
  default: () => <div data-testid="media" />,
}));

jest.mock('@/components/brain/my-stream/votes/MyStreamWaveMyVoteVotes', () => ({
  __esModule: true,
  default: () => <div data-testid="votes" />,
}));

jest.mock('@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput', () => ({
  __esModule: true,
  default: () => <div data-testid="input" />,
}));

jest.mock('@/components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
  UserCICAndLevelSize: { SMALL: 'SMALL' },
}));

jest.mock('@/components/waves/drop/SingleWaveDropPosition', () => ({
  __esModule: true,
  SingleWaveDropPosition: ({ rank }: any) => <div data-testid="pos">{rank}</div>,
  default: ({ rank }: any) => <div data-testid="pos">{rank}</div>
}));

describe('MyStreamWaveMyVote', () => {
  const drop: any = {
    id: 'd1',
    title: 'Drop Title',
    parts: [{ media: [{ url: 'a', mime_type: 'image/jpeg' }] }],
    author: { handle: 'alice', cic: 1, level: 2 },
    rating: 0,
    raters_count: 3,
  };

  it('triggers onDropClick when no text selected', () => {
    const onDropClick = jest.fn();
    (window.getSelection as any) = () => ({ toString: () => '' });
    const { container } = render(<MyStreamWaveMyVote drop={drop} onDropClick={onDropClick} />);
    fireEvent.click(container.firstChild!);
    expect(onDropClick).toHaveBeenCalledWith(drop);
  });

  it('does not trigger onDropClick when text selected', () => {
    const onDropClick = jest.fn();
    (window.getSelection as any) = () => ({ toString: () => 'sel' });
    const { container } = render(<MyStreamWaveMyVote drop={drop} onDropClick={onDropClick} />);
    fireEvent.click(container.firstChild!);
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it('calls onToggleCheck when checkbox clicked', () => {
    const onToggleCheck = jest.fn();
    (window.getSelection as any) = () => ({ toString: () => '' });
    const { container } = render(
      <MyStreamWaveMyVote drop={drop} onDropClick={jest.fn()} isChecked={false} onToggleCheck={onToggleCheck} />
    );
    const checkbox = container.querySelector('.tw-flex-shrink-0');
    fireEvent.click(checkbox!);
    expect(onToggleCheck).toHaveBeenCalledWith('d1');
  });
});
