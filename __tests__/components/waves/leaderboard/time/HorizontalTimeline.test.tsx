import React from 'react';
import { render } from '@testing-library/react';
import { HorizontalTimeline } from '@/components/waves/leaderboard/time/HorizontalTimeline';

const decisions = [
  { id: '1', timestamp: 1 },
  { id: '2', timestamp: 2 },
  { id: '3', timestamp: 3 },
  { id: '4', timestamp: 4 },
  { id: '5', timestamp: 5 },
  { id: '6', timestamp: 6 }
] as any;

describe('HorizontalTimeline', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: jest.fn(), writable: true });
  });

  it('scrolls to next decision when animation completed', () => {
    render(
      <HorizontalTimeline decisions={decisions} nextDecisionTime={3} animationComplete />
    );
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('falls back to last decision when no next decision', () => {
    render(
      <HorizontalTimeline decisions={decisions} nextDecisionTime={null} animationComplete />
    );
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('spreads items when few decisions', () => {
    const { container } = render(
      <HorizontalTimeline decisions={decisions.slice(0,3)} nextDecisionTime={null} animationComplete />
    );
    expect(container.querySelector('.tw-w-full')).toBeTruthy();
  });
});
