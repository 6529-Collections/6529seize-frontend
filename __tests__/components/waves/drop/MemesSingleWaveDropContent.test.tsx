import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemesSingleWaveDropContent } from '../../../../components/waves/drop/MemesSingleWaveDropContent';

jest.mock('../../../../components/waves/drop/SingleWaveDropContentMetadata', () => ({
  SingleWaveDropContentMetadata: () => <div data-testid="metadata" />
}));

describe('MemesSingleWaveDropContent', () => {
  const baseDrop: any = {
    metadata: [{ data_key: 'title', data_value: 'T' }, { data_key: 'description', data_value: 'D' }],
    parts: [{ media: [{ url: 'img.png' }] }]
  };

  it('renders title, description and image', () => {
    render(<MemesSingleWaveDropContent drop={baseDrop} />);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveAttribute('alt', 'T');
    expect(screen.getByTestId('metadata')).toBeInTheDocument();
  });

  it('renders placeholder when no media', () => {
    render(<MemesSingleWaveDropContent drop={{ metadata: [], parts: [] } as any} />);
    expect(screen.getByText('Artwork preview')).toBeInTheDocument();
  });
});
