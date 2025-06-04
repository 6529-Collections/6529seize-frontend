import { render } from '@testing-library/react';
import UnifiedWavesListEmpty from '../../../../../components/brain/left-sidebar/waves/UnifiedWavesListEmpty';
import React from 'react';

describe('UnifiedWavesListEmpty', () => {
  it('returns null when waves exist', () => {
    const { container } = render(
      <UnifiedWavesListEmpty sortedWaves={[{ id: '1' }]} isFetchingNextPage={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when fetching next page', () => {
    const { container } = render(
      <UnifiedWavesListEmpty sortedWaves={[]} isFetchingNextPage={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows message when empty', () => {
    const { getByText } = render(
      <UnifiedWavesListEmpty sortedWaves={[]} isFetchingNextPage={false} emptyMessage="none" />
    );
    expect(getByText('none')).toBeInTheDocument();
  });
});
