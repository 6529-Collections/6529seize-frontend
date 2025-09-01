import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const addId = jest.fn();
const removeId = jest.fn();

jest.mock('../../../../hooks/usePinnedWaves', () => ({
  usePinnedWaves: () => ({ pinnedIds: mockPinnedIds, addId, removeId }),
}));

let mockPinnedIds: string[] = [];

const replace = jest.fn();
const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

jest.mock('../../../../components/brain/content/BrainContentPinnedWave', () => ({
  __esModule: true,
  default: ({ waveId, onRemove }: any) => (
    <div data-testid={`wave-${waveId}`} onClick={() => onRemove(waveId)}>wave {waveId}</div>
  ),
}));

import BrainContentPinnedWaves from '../../../../components/brain/content/BrainContentPinnedWaves';

beforeAll(() => {
  (window as any).matchMedia = (window as any).matchMedia || (() => ({ matches: false, addListener: jest.fn(), removeListener: jest.fn() }));
  (global as any).ResizeObserver = class { observe() {}; unobserve() {}; disconnect() {}; };
});


describe('BrainContentPinnedWaves', () => {
  beforeEach(() => {
    addId.mockClear();
    removeId.mockClear();
    replace.mockClear();
    mockPinnedIds = [];
    searchParams.delete('wave');
  });

  it('returns null when no pinned waves', () => {
    const { container } = render(<BrainContentPinnedWaves />);
    expect(container.firstChild).toBeNull();
  });

  it('renders pinned waves and handles removal', async () => {
    mockPinnedIds = ['1', '2'];
    searchParams.set('wave', '1');
    const user = userEvent.setup();
    render(<BrainContentPinnedWaves />);
    await waitFor(() => expect(addId).toHaveBeenCalledWith('1'));
    const wave1 = screen.getByTestId('wave-1');
    const wave2 = screen.getByTestId('wave-2');
    expect(wave1).toBeInTheDocument();
    expect(wave2).toBeInTheDocument();
    await user.click(wave1);
    expect(removeId).toHaveBeenCalledWith('1');
    expect(replace).toHaveBeenCalledWith('/my-stream');
  });
});
