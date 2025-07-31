import { render, screen } from '@testing-library/react';
import React from 'react';
import UploadArea from '../../../../../components/waves/memes/file-upload/components/UploadArea';

jest.mock('framer-motion', () => ({ motion: { div: (props: any) => <div {...props} /> } }));

jest.mock('../../../../../components/waves/memes/file-upload/components/FileTypeIndicator', () => (props: any) => (
  <div data-testid="format">{props.format}</div>
));

jest.mock('../../../../../components/waves/memes/file-upload/components/ErrorMessage', () => (props: any) => (
  <div data-testid="error">{props.error}</div>
));

describe('UploadArea', () => {
  it('renders formats and select text', () => {
    const { getAllByTestId } = render(
      <UploadArea visualState="idle" error={null} hasRecoveryOption={false} onRetry={jest.fn()} />
    );
    expect(screen.getByText('Select Art')).toBeInTheDocument();
    expect(getAllByTestId('format')).toHaveLength(5);
  });

  it('shows processing overlay', () => {
    render(
      <UploadArea visualState="processing" error={null} hasRecoveryOption={false} onRetry={jest.fn()} />
    );
    expect(screen.getByText('Processing file...')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <UploadArea visualState="idle" error="Oops" hasRecoveryOption={true} onRetry={jest.fn()} />
    );
    expect(screen.getByTestId('error')).toHaveTextContent('Oops');
  });
});
