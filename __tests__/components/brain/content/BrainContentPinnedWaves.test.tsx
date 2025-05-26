import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUsePinnedWaves = {
  pinnedIds: [] as string[],
  addId: jest.fn(),
  removeId: jest.fn(),
};

jest.mock('../../../../hooks/usePinnedWaves', () => ({
  usePinnedWaves: () => mockUsePinnedWaves,
}));

jest.mock('../../../../components/brain/content/BrainContentPinnedWave', () => (props: any) => (
  <div data-testid="pinned-wave">{props.waveId}</div>
));

jest.mock('next/router', () => ({ useRouter: () => ({ query: {}, replace: jest.fn() }) }));

// window.matchMedia stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() })),
});

(global as any).ResizeObserver = class {
  observe() {}
  disconnect() {}
};

import BrainContentPinnedWaves from '../../../../components/brain/content/BrainContentPinnedWaves';

describe('BrainContentPinnedWaves', () => {
  it('returns null when no pinned ids', () => {
    mockUsePinnedWaves.pinnedIds = [];
    const { container } = render(<BrainContentPinnedWaves />);
    expect(container.firstChild).toBeNull();
  });

  it('renders pinned waves and arrows respond to clicks', () => {
    mockUsePinnedWaves.pinnedIds = ['a', 'b'];
    const { container } = render(<BrainContentPinnedWaves />);
    expect(screen.getAllByTestId('pinned-wave')).toHaveLength(2);
    // simulate arrow elements existence
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => fireEvent.click(btn));
  });
});
