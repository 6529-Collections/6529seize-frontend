import { render } from '@testing-library/react';
import { WaveLeaderboardRightSidebarVoter } from '../../../../../components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter';
import { ApiWaveCreditType } from '../../../../../generated/models/ApiWaveCreditType';

const baseVoter = {
  voter: { handle: 'alice', pfp: '' },
  positive_votes_summed: 2,
  negative_votes_summed: 0,
  absolute_votes_summed: 2,
};

describe('WaveLeaderboardRightSidebarVoter', () => {
  it('shows positive indicator when positive votes exist', () => {
    const { container } = render(
      <WaveLeaderboardRightSidebarVoter voter={baseVoter as any} position={1} creditType={ApiWaveCreditType.Rep} />
    );
    expect(container.querySelectorAll('.tw-bg-green').length).toBe(1);
    expect(container.querySelectorAll('.tw-bg-red').length).toBe(0);
  });

  it('shows negative indicator when negative votes exist', () => {
    const voter = { ...baseVoter, negative_votes_summed: 1 };
    const { container } = render(
      <WaveLeaderboardRightSidebarVoter voter={voter as any} position={1} creditType={ApiWaveCreditType.Rep} />
    );
    expect(container.querySelectorAll('.tw-bg-red').length).toBe(1);
  });
});
