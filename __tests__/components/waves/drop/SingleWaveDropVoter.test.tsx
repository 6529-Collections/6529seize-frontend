import React from 'react';
import { render, screen } from '@testing-library/react';
import { SingleWaveDropVoter } from '../../../../components/waves/drop/SingleWaveDropVoter';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('@tippyjs/react', () => ({ children }: any) => <div data-testid="tippy">{children}</div>);

describe('SingleWaveDropVoter', () => {
  const baseVoter = {
    voter: { handle: '0x1111111111111111111111111111111111111111', pfp: null },
    positive_votes_summed: 2,
    negative_votes_summed: 1,
    absolute_votes_summed: 3,
  } as any;

  it('renders voter information and totals', () => {
    render(
      <SingleWaveDropVoter
        voter={baseVoter}
        position={1}
        creditType={ApiWaveCreditType.Rep}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(baseVoter.voter.handle)).toBeInTheDocument();
    expect(screen.getByText('3 REP total')).toBeInTheDocument();
    const handleSpan = screen.getByText(baseVoter.voter.handle).parentElement as HTMLElement;
    expect(handleSpan.className).toContain('tw-inline-block');
    expect(handleSpan.className).toContain('tw-truncate');
  });
});
