import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MyStreamWaveTabsLeaderboard from '../../../../components/brain/my-stream/MyStreamWaveTabsLeaderboard';
import { BrainView } from '../../../../components/brain/BrainMobile';

jest.mock('../../../../components/brain/BrainMobile', () => ({
  BrainView: { DEFAULT: 'DEFAULT', LEADERBOARD: 'LEADERBOARD', WINNERS: 'WINNERS' }
}));

jest.mock('../../../../hooks/useWaveTimers', () => ({
  useWaveTimers: () => ({
    voting: { isCompleted: mockCompleted },
    decisions: { firstDecisionDone: mockFirstDecision },
  }),
}));

let mockCompleted = false;
let mockFirstDecision = false;

function renderComponent(view: BrainView = BrainView.DEFAULT, props: any = {}) {
  const onViewChange = jest.fn();
  const registerTabRef = jest.fn();
  render(
    <MyStreamWaveTabsLeaderboard
      wave={{} as any}
      activeView={view}
      onViewChange={onViewChange}
      registerTabRef={registerTabRef}
      {...props}
    />
  );
  return { onViewChange, registerTabRef };
}

describe('MyStreamWaveTabsLeaderboard', () => {
  beforeEach(() => {
    mockCompleted = false;
    mockFirstDecision = false;
  });

  it('shows leaderboard tab when voting ongoing', () => {
    const { registerTabRef } = renderComponent();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(registerTabRef).toHaveBeenCalledWith(BrainView.LEADERBOARD, expect.any(HTMLButtonElement));
    expect(screen.queryByText('Winners')).toBeNull();
  });

  it('shows winners tab after first decision', async () => {
    mockFirstDecision = true;
    const { onViewChange } = renderComponent();
    const button = screen.getByText('Winners');
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.WINNERS);
  });

  it('hides leaderboard when voting completed', () => {
    mockCompleted = true;
    renderComponent();
    expect(screen.queryByText('Leaderboard')).toBeNull();
  });
});
