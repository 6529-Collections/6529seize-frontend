import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveDropsScrollBottomButton } from '@/components/waves/drops/WaveDropsScrollBottomButton';

describe('WaveDropsScrollBottomButton', () => {
  it('does not render when at bottom', () => {
    const { container } = render(
      <WaveDropsScrollBottomButton isAtBottom={true} scrollToBottom={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls scrollToBottom when clicked', async () => {
    const scrollToBottom = jest.fn();
    render(
      <WaveDropsScrollBottomButton isAtBottom={false} scrollToBottom={scrollToBottom} />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(scrollToBottom).toHaveBeenCalled();
  });
});
