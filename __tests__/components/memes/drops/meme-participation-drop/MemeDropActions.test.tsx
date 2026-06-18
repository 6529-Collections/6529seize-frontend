import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeDropActions from '@/components/memes/drops/meme-participation-drop/MemeDropActions';

jest.mock('@/components/waves/drops/WaveDropActions', () => (props: any) => (
  <div data-testid="wave-actions">{JSON.stringify(props)}</div>
));

describe('MemeDropActions', () => {
  const drop = { id: 'd1' } as any;
  const callbacks = { onReply: jest.fn(), onQuote: jest.fn() };

  it('returns null when desktop hover actions are unavailable or hidden', () => {
    const { rerender } = render(
      <MemeDropActions
        drop={drop}
        canUseDesktopHoverActions={false}
        showReplyAndQuote={true}
        {...callbacks}
      />
    );
    expect(screen.queryByTestId('wave-actions')).toBeNull();
    rerender(
      <MemeDropActions
        drop={drop}
        canUseDesktopHoverActions={true}
        showReplyAndQuote={false}
        {...callbacks}
      />
    );
    expect(screen.queryByTestId('wave-actions')).toBeNull();
  });

  it('renders WaveDropActions when allowed', () => {
    render(
      <MemeDropActions
        drop={drop}
        canUseDesktopHoverActions={true}
        showReplyAndQuote
        {...callbacks}
      />
    );
    const element = screen.getByTestId("wave-actions");
    expect(element.textContent).toContain("d1");
  });
});
