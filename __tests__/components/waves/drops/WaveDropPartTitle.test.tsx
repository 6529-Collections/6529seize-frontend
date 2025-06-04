import { render, screen } from '@testing-library/react';
import React from 'react';
import WaveDropPartTitle from '../../../../components/waves/drops/WaveDropPartTitle';

describe('WaveDropPartTitle', () => {
  it('renders title when provided', () => {
    render(<WaveDropPartTitle title="MyTitle" />);
    expect(screen.getByText('MyTitle')).toBeInTheDocument();
  });

  it('returns null when title is null', () => {
    const { container } = render(<WaveDropPartTitle title={null} />);
    expect(container.firstChild).toBeNull();
  });
});
