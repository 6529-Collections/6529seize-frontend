import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import OngoingParticipationDrop from '@/components/waves/drops/participation/OngoingParticipationDrop';
import type { ExtendedDrop } from '@/helpers/waves/drop.helpers';

// Mock hooks and child components
const useIsMobileDevice = jest.fn();
jest.mock('@/hooks/isMobileDevice', () => ({ __esModule: true, default: (...args: any[]) => useIsMobileDevice(...args) }));

jest.mock('@/components/waves/drops/WaveDropActions', () => (props: any) => (
  <div data-testid="actions" onClick={props.onReply}></div>
));

let longPressCb: () => void;

jest.mock('@/components/waves/drops/participation/ParticipationDropContent', () => (props: any) => {
  longPressCb = props.onLongPress;
  return (
    <button data-testid="content" onClick={() => longPressCb()}></button>
  );
});

let mobileMenuProps: any;
jest.mock('@/components/waves/drops/WaveDropMobileMenu', () => (props: any) => {
  mobileMenuProps = props;
  return <div data-testid="mobile-menu" data-open={props.isOpen}></div>;
});

jest.mock('@/components/waves/drops/participation/ParticipationDropHeader', () => () => <div />);
jest.mock('@/components/waves/drops/participation/ParticipationDropMetadata', () => () => <div />);
jest.mock('@/components/waves/drops/participation/ParticipationDropFooter', () => () => <div />);
jest.mock('@/components/waves/drops/participation/ParticipationDropContainer', () => (props: any) => <div>{props.children}</div>);
jest.mock('@/components/waves/drops/WaveDropAuthorPfp', () => () => <div />);

const drop: ExtendedDrop = {
  id: 'd1',
  parts: [{ part_id: 'p1' }],
  metadata: [],
  wave: { id: 'w1' } as any,
} as any;

const renderComp = (mobile = false) => {
  const onReply = jest.fn();
  const onQuote = jest.fn();
  useIsMobileDevice.mockReturnValue(mobile);
  render(
    <OngoingParticipationDrop
      drop={drop}
      showWaveInfo={false}
      activeDrop={null}
      showReplyAndQuote={true}
      location="wave"
      onReply={onReply}
      onQuote={onQuote}
      onQuoteClick={jest.fn()}
    />
  );
  return { onReply, onQuote };
};

describe('OngoingParticipationDrop', () => {
  it('shows actions on desktop', () => {
    renderComp(false);
    expect(screen.getByTestId('actions')).toBeInTheDocument();
  });

  it('opens mobile menu on long press and handles reply', async () => {
    const user = userEvent.setup();
    const { onReply } = renderComp(true);
    await user.click(screen.getByTestId('content')); // triggers long press
    expect(mobileMenuProps.isOpen).toBe(true);
    await user.click(screen.getByTestId('mobile-menu'));
    mobileMenuProps.onReply();
    expect(onReply).toHaveBeenCalledWith({ drop, partId: 'p1' });
    expect(mobileMenuProps.setOpen).toBeDefined();
  });
});

