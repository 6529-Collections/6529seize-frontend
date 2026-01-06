import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleWaveDropVoteContent } from '@/components/waves/drop/SingleWaveDropVoteContent';
import type { ApiDrop } from '@/generated/models/ApiDrop';
import { ApiWaveCreditType } from '@/generated/models/ApiWaveCreditType';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <span /> }));
jest.mock('@/components/waves/drop/SingleWaveDropVoteSubmit', () => {
  return React.forwardRef(function MockSubmit(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({ handleClick: jest.fn() }));
    return <div data-testid="submit" />;
  });
});
jest.mock('@/components/waves/drop/SingleWaveDropVoteSlider', () => ({ __esModule: true, default: (props: any) => <div data-testid="slider" onClick={() => props.setVoteValue(5)} /> }));
jest.mock('@/components/waves/drop/SingleWaveDropVoteInput', () => ({ __esModule: true, SingleWaveDropVoteInput: (props: any) => <input data-testid="input" value={props.voteValue} onChange={e=>props.setVoteValue(e.target.value)} /> }));
jest.mock('@/components/waves/drop/SingleWaveDropVoteStats', () => ({ __esModule: true, SingleWaveDropVoteStats: () => <div data-testid="stats" /> }));

describe('SingleWaveDropVoteContent', () => {
  const drop: ApiDrop = {
    id: 'd',
    serial_no: 1,
    rank: 1,
    wave: { id:'w', name:'', voting_credit_type: ApiWaveCreditType.Tdh } as any,
    context_profile_context: { rating: 1, min_rating: 0, max_rating: 10 },
    parts: [], referenced_nfts: [], mentioned_users: [], metadata: [], author: { id:'a', handle:'h' } as any,
    created_at: Date.now(), updated_at: Date.now()
  } as ApiDrop;

  it('toggles between slider and input', () => {
    render(<SingleWaveDropVoteContent drop={drop} size={"NORMAL" as any} />);
    expect(screen.getByTestId('slider')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });
});
