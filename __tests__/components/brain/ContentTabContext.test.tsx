import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTabProvider, useContentTab, WaveVotingState } from '../../../components/brain/ContentTabContext';
import { MyStreamWaveTab } from '../../../types/waves.types';

function TestComponent() {
  const { activeContentTab, setActiveContentTab, availableTabs, updateAvailableTabs } = useContentTab();
  return (
    <div>
      <span data-testid="active">{activeContentTab}</span>
      <span data-testid="available">{availableTabs.join(',')}</span>
      <button onClick={() => setActiveContentTab(MyStreamWaveTab.LEADERBOARD)}>setLB</button>
      <button onClick={() => updateAvailableTabs(null)}>reset</button>
      <button
        onClick={() =>
          updateAvailableTabs({
            isChatWave: false,
            isMemesWave: false,
            votingState: WaveVotingState.NOT_STARTED,
            hasFirstDecisionPassed: false,
          })
        }
      >
        standard
      </button>
    </div>
  );
}

describe('ContentTabContext', () => {
  it('updates tabs based on wave state', async () => {
    render(
      <ContentTabProvider>
        <TestComponent />
      </ContentTabProvider>
    );

    // initial state
    expect(screen.getByTestId('active')).toHaveTextContent(MyStreamWaveTab.CHAT);
    expect(screen.getByTestId('available')).toHaveTextContent(MyStreamWaveTab.CHAT);

    // attempt to set unavailable tab
    await userEvent.click(screen.getByText('setLB'));
    expect(screen.getByTestId('active')).toHaveTextContent(MyStreamWaveTab.CHAT);

    // update to standard wave (adds leaderboard)
    await userEvent.click(screen.getByText('standard'));
    expect(screen.getByTestId('available').textContent).toContain(MyStreamWaveTab.LEADERBOARD);

    // now setting leaderboard should work
    await userEvent.click(screen.getByText('setLB'));
    expect(screen.getByTestId('active')).toHaveTextContent(MyStreamWaveTab.LEADERBOARD);

    // reset tabs, should revert to chat only and switch active tab back
    await userEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('active')).toHaveTextContent(MyStreamWaveTab.CHAT);
    expect(screen.getByTestId('available')).toHaveTextContent(MyStreamWaveTab.CHAT);
  });
});
