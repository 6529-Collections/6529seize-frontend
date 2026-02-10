import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropContentMissingMediaWarning from '@/components/drops/create/utils/storm/CreateDropContentMissingMediaWarning';
import { ApiWaveParticipationRequirement } from '@/generated/models/ApiWaveParticipationRequirement';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

describe('CreateDropContentMissingMediaWarning', () => {
  it.each([
    [ApiWaveParticipationRequirement.Audio, 'Audio is required', 'Please upload an audio file'],
    [ApiWaveParticipationRequirement.Video, 'Video is required', 'Please upload a video file'],
    [ApiWaveParticipationRequirement.Image, 'Image is required', 'Please upload an image file'],
  ])('shows label and tooltip for %s', (type, label, tooltip) => {
    render(<CreateDropContentMissingMediaWarning missingMedia={[type]} />);
    
    // Check that the label text is displayed
    expect(screen.getByText(label)).toBeInTheDocument();
    
    // Check that the tooltip element is rendered
    const tooltipElement = screen.getByTestId('react-tooltip');
    expect(tooltipElement).toBeInTheDocument();
    expect(tooltipElement).toHaveAttribute('data-tooltip-id', `missing-media-warning-${type.toLowerCase()}`);
    
    // Check that the tooltip content contains the expected text
    expect(tooltipElement.textContent).toContain(tooltip);
  });
});
