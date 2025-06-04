import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamWaveMyVoteVotes from '../../../../../components/brain/my-stream/votes/MyStreamWaveMyVoteVotes';
import DropVoteProgressing from '../../../../../components/drops/view/utils/DropVoteProgressing';

jest.mock('../../../../../components/drops/view/utils/DropVoteProgressing');

const ProgressMock = DropVoteProgressing as jest.Mock;

describe('MyStreamWaveMyVoteVotes', () => {
  beforeEach(() => {
    ProgressMock.mockClear();
  });

  const drop = { rating: 5, rating_prediction: 6 } as any;

  it('shows positive rating style', () => {
    render(<MyStreamWaveMyVoteVotes drop={drop} />);
    expect(screen.getByText('5')).toHaveClass('tw-text-emerald-500');
    expect(ProgressMock).toHaveBeenCalled();
  });

  it('shows negative rating style', () => {
    render(<MyStreamWaveMyVoteVotes drop={{ ...drop, rating: -1 }} />);
    expect(screen.getByText('-1')).toHaveClass('tw-text-rose-500');
  });
});
