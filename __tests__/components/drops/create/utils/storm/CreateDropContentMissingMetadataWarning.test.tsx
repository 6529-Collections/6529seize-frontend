import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropContentMissingMetadataWarning from '../../../../../../components/drops/create/utils/storm/CreateDropContentMissingMetadataWarning';
import { ApiWaveRequiredMetadata } from '../../../../../../generated/models/ApiWaveRequiredMetadata';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children, content }: any) => (
  <div data-testid="tippy">{children}{content}</div>
)}));

describe('CreateDropContentMissingMetadataWarning', () => {
  it('shows list of missing metadata', () => {
    const metadata: ApiWaveRequiredMetadata[] = [
      { name: 'Title', type: 'STRING' } as any,
      { name: 'Count', type: 'NUMBER' } as any,
    ];
    render(<CreateDropContentMissingMetadataWarning missingMetadata={metadata} />);
    const tooltip = screen.getByTestId('tippy');
    expect(tooltip.textContent).toContain('"Title" is required');
    expect(tooltip.textContent).toContain('type: text');
    expect(tooltip.textContent).toContain('type: number');
  });
});
