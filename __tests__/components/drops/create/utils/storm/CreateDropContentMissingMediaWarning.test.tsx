import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropContentMissingMediaWarning from '../../../../../../components/drops/create/utils/storm/CreateDropContentMissingMediaWarning';
import { ApiWaveParticipationRequirement } from '../../../../../../generated/models/ApiWaveParticipationRequirement';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children, content }: any) => (
  <div data-testid="tippy" data-content={content}>{children}</div>
)}));

describe('CreateDropContentMissingMediaWarning', () => {
  it.each([
    [ApiWaveParticipationRequirement.Audio, 'Audio is required', 'Please upload an audio file'],
    [ApiWaveParticipationRequirement.Video, 'Video is required', 'Please upload a video file'],
    [ApiWaveParticipationRequirement.Image, 'Image is required', 'Please upload an image file'],
  ])('shows label and tooltip for %s', (type, label, tooltip) => {
    render(<CreateDropContentMissingMediaWarning missingMedia={[type]} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByTestId('tippy')).toHaveAttribute('data-content', tooltip);
  });
});
