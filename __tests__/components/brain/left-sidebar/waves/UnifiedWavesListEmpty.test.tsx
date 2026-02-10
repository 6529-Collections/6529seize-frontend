import { render } from '@testing-library/react';
import UnifiedWavesListEmpty from '@/components/brain/left-sidebar/waves/UnifiedWavesListEmpty';
import React from 'react';
import { createMockMinimalWave } from '@/__tests__/utils/mockFactories';

describe('UnifiedWavesListEmpty', () => {
  it('returns null when waves exist', () => {
    const { container } = render(
      <UnifiedWavesListEmpty sortedWaves={[createMockMinimalWave({ id: '1' })]} isFetching={false} isFetchingNextPage={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when fetching next page', () => {
    const { container } = render(
      <UnifiedWavesListEmpty sortedWaves={[]} isFetching={false} isFetchingNextPage={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows message when empty', () => {
    const { getByText } = render(
      <UnifiedWavesListEmpty sortedWaves={[]} isFetching={false} isFetchingNextPage={false} emptyMessage="none" />
    );
    expect(getByText('none')).toBeInTheDocument();
  });
});
