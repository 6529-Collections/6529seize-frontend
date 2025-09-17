import { render, screen } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebarSearchWaveDropdownContent from '../../../../../components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveDropdownContent';

jest.mock('../../../../../components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveItem', () => ({
  __esModule: true,
  default: ({ wave }: any) => <li data-testid="wave-item">{wave.name}</li>
}));

describe('BrainLeftSidebarSearchWaveDropdownContent', () => {
  it('renders loading state', () => {
    render(
      <BrainLeftSidebarSearchWaveDropdownContent loading waves={[]} onClose={jest.fn()} listType="waves" />
    );
    expect(screen.getByText('Loading...', { selector: 'li' })).toBeInTheDocument();
  });

  it('renders list of waves when present', () => {
    const waves = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    render(
      <BrainLeftSidebarSearchWaveDropdownContent loading={false} waves={waves as any} onClose={jest.fn()} listType="waves" />
    );
    expect(screen.getAllByTestId('wave-item')).toHaveLength(2);
  });

  it('renders no results message when list empty', () => {
    render(
      <BrainLeftSidebarSearchWaveDropdownContent loading={false} waves={[]} onClose={jest.fn()} listType="waves" />
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});
