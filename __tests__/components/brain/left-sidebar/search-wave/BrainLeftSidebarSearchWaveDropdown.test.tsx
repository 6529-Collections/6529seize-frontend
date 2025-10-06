import { render, screen } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebarSearchWaveDropdown from '@/components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveDropdown';

const useWaves = jest.fn();

jest.mock('@/hooks/useWaves', () => ({ useWaves: (...args: any[]) => useWaves(...args) }));

jest.mock('@/components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveDropdownContent', () => ({
  __esModule: true,
  default: ({ waves, loading }: any) => (
    <div data-testid="content">{loading ? 'loading' : waves.map((w: any) => w.name).join(',')}</div>
  )
}));

describe('BrainLeftSidebarSearchWaveDropdown', () => {
  it('does not render when closed', () => {
    useWaves.mockReturnValue({ waves: [], isFetching: false });
    const { container } = render(
      <BrainLeftSidebarSearchWaveDropdown open={false} searchCriteria={null} onClose={jest.fn()} listType="waves" />
    );
    expect(container.querySelector('[data-testid="content"]')).toBeNull();
  });

  it('shows waves when open', () => {
    useWaves.mockReturnValue({ waves: [{ id: '1', name: 'Wave1' }], isFetching: false });
    render(
      <BrainLeftSidebarSearchWaveDropdown open searchCriteria="wave" onClose={jest.fn()} listType="waves" />
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Wave1');
  });
});
