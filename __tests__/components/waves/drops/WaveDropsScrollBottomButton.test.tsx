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

  it('renders pending badge and triggers reveal handler', async () => {
    const onReveal = jest.fn();
    render(
      <WaveDropsScrollBottomButton
        isAtBottom={false}
        scrollToBottom={jest.fn()}
        newMessagesCount={3}
        onRevealNewMessages={onReveal}
      />
    );
    expect(screen.getByText('3 new messages')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /reveal new messages/i }));
    expect(onReveal).toHaveBeenCalled();
  });
});
