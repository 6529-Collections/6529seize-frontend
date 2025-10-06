import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemesSingleWaveDropContent } from '@/components/waves/drop/MemesSingleWaveDropContent';

jest.mock('@/components/waves/drop/SingleWaveDropContentMetadata', () => ({
  SingleWaveDropContentMetadata: () => <div data-testid="metadata" />
}));

describe('MemesSingleWaveDropContent', () => {
  const baseDrop: any = {
    metadata: [
      { data_key: 'title', data_value: 'Test Title' },
      { data_key: 'description', data_value: 'Test Description' }
    ],
    parts: [{ media: [{ url: 'img.png' }] }]
  };

  it('renders title, description and image', () => {
    render(<MemesSingleWaveDropContent drop={baseDrop} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveAttribute('alt', 'Test Title');
    expect(screen.getByTestId('metadata')).toBeInTheDocument();
  });

  it('renders placeholder when no media', () => {
    const dropWithoutMedia = {
      ...baseDrop,
      parts: []
    };
    render(<MemesSingleWaveDropContent drop={dropWithoutMedia} />);
    expect(screen.getByText('Artwork preview')).toBeInTheDocument();
  });

  it('renders placeholder when no parts', () => {
    render(<MemesSingleWaveDropContent drop={{ metadata: [], parts: [] } as any} />);
    expect(screen.getByText('Artwork preview')).toBeInTheDocument();
  });
});
