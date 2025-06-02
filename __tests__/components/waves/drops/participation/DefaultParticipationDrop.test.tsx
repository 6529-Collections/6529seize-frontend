import { render, screen } from '@testing-library/react';
import React from 'react';
import ParticipationDrop from '../../../../../components/waves/drops/participation/DefaultParticipationDrop';
import { DropLocation } from '../../../../../components/waves/drops/Drop';

jest.mock('../../../../../hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: jest.fn()
}));

jest.mock('../../../../../components/waves/drops/participation/OngoingParticipationDrop', () => () => <div data-testid="ongoing" />);
jest.mock('../../../../../components/waves/drops/participation/EndedParticipationDrop', () => () => <div data-testid="ended" />);

const { useDropInteractionRules } = require('../../../../../hooks/drops/useDropInteractionRules');

describe('DefaultParticipationDrop', () => {
  const baseProps = {
    drop: {} as any,
    showWaveInfo: false,
    activeDrop: null,
    showReplyAndQuote: true,
    location: DropLocation.MY_STREAM,
    onReply: jest.fn(),
    onQuote: jest.fn(),
    onQuoteClick: jest.fn()
  };

  it('renders ongoing component when voting ongoing', () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({ isVotingEnded: false });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId('ongoing')).toBeInTheDocument();
  });

  it('renders ended component when voting finished', () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({ isVotingEnded: true });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId('ended')).toBeInTheDocument();
  });
});
