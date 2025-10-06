import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropContentMissingMetadataWarning from '@/components/drops/create/utils/storm/CreateDropContentMissingMetadataWarning';
import { ApiWaveRequiredMetadata } from '@/generated/models/ApiWaveRequiredMetadata';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid="react-tooltip" data-tooltip-id={id}>
      {children}
    </div>
  ),
}));

describe('CreateDropContentMissingMetadataWarning', () => {
  it('shows list of missing metadata', () => {
    const metadata: ApiWaveRequiredMetadata[] = [
      { name: 'Title', type: 'STRING' } as any,
      { name: 'Count', type: 'NUMBER' } as any,
    ];
    render(<CreateDropContentMissingMetadataWarning missingMetadata={metadata} />);
    
    // Check that the warning text is displayed
    expect(screen.getByText('Metadata is required')).toBeInTheDocument();
    
    // Check that the tooltip element is rendered
    const tooltip = screen.getByTestId('react-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-tooltip-id', 'missing-metadata-warning');
    
    // Check that the tooltip content contains the missing metadata information
    expect(tooltip.textContent).toContain('"Title" is required');
    expect(tooltip.textContent).toContain('type: text');
    expect(tooltip.textContent).toContain('"Count" is required');
    expect(tooltip.textContent).toContain('type: number');
  });
});
