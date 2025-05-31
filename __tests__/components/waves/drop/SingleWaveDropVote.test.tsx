import { render, screen } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropVote, SingleWaveDropVoteSize } from '../../../../components/waves/drop/SingleWaveDropVote';

let capturedProps: any;

jest.mock('next/dynamic', () => () => (props: any) => { capturedProps = props; return <div data-testid="content" />; });

const drop: any = { id: 'd1' };

describe('SingleWaveDropVote', () => {
  it('passes props to dynamic content component', () => {
    const onSuccess = jest.fn();
    render(<SingleWaveDropVote drop={drop} size={SingleWaveDropVoteSize.COMPACT} onVoteSuccess={onSuccess} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(capturedProps).toEqual({ drop, size: SingleWaveDropVoteSize.COMPACT, onVoteSuccess: onSuccess });
  });
});
