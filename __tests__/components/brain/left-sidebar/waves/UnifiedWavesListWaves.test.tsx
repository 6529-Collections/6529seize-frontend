import React from 'react';
import { render, screen } from '@testing-library/react';
import UnifiedWavesListWaves, { UnifiedWavesListWavesHandle } from '../../../../../components/brain/left-sidebar/waves/UnifiedWavesListWaves';
import { useShowFollowingWaves } from '../../../../../hooks/useShowFollowingWaves';
import { useAuth } from '../../../../../components/auth/Auth';
import { useVirtualizedWaves } from '../../../../../hooks/useVirtualizedWaves';

jest.mock('../../../../../components/utils/switch/CommonSwitch', () => (props: any) => <div data-testid="switch">{props.label}-{String(props.isOn)}</div>);
jest.mock('../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWave', () => (props: any) => <div data-testid={`wave-${props.wave.id}`} data-pin={String(props.showPin)} />);
jest.mock('../../../../../components/brain/left-sidebar/waves/SectionHeader', () => (props: any) => <div data-testid={`header-${props.label}`}>{props.label}{props.rightContent}</div>);

jest.mock('../../../../../hooks/useShowFollowingWaves');
jest.mock('../../../../../components/auth/Auth');
jest.mock('../../../../../hooks/useVirtualizedWaves');

const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseVirtualizedWaves = useVirtualizedWaves as jest.Mock;

const scrollRef = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
const container = document.createElement('div');
const sentinel = document.createElement('div');

const baseWaves = [
  { id: 'p1', isPinned: true },
  { id: 'r1', isPinned: false }
] as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  mockUseAuth.mockReturnValue({ connectedProfile: { handle: 'alice' }, activeProfileProxy: null });
  mockUseVirtualizedWaves.mockReturnValue({
    containerRef: { current: container },
    sentinelRef: { current: sentinel },
    virtualItems: [
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 40 }
    ],
    totalHeight: 102
  });
});

it('returns null when no waves', () => {
  const { container } = render(
    <UnifiedWavesListWaves waves={[]} onHover={jest.fn()} scrollContainerRef={scrollRef} />
  );
  expect(container.firstChild).toBeNull();
});

it('renders pinned and regular waves with headers and switch', () => {
  const ref = React.createRef<UnifiedWavesListWavesHandle>();
  render(
    <UnifiedWavesListWaves waves={baseWaves} onHover={jest.fn()} scrollContainerRef={scrollRef} ref={ref} />
  );
  expect(screen.getByTestId('header-Pinned')).toBeInTheDocument();
  expect(screen.getByTestId('header-All Waves')).toBeInTheDocument();
  expect(screen.getByTestId('switch')).toBeInTheDocument();
  expect(screen.getByTestId('wave-p1')).toHaveAttribute('data-pin', 'true');
  expect(screen.getByTestId('wave-r1')).toHaveAttribute('data-pin', 'true');
  expect(ref.current?.containerRef.current).toBe(container);
  expect(ref.current?.sentinelRef.current).toBeInstanceOf(HTMLElement);
});

it('respects hide options and does not render toggle when not connected', () => {
  mockUseAuth.mockReturnValue({ connectedProfile: null, activeProfileProxy: null });
  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      hideHeaders
      hidePin
      hideToggle
    />
  );
  expect(screen.queryByTestId('header-Pinned')).toBeNull();
  expect(screen.queryByTestId('header-All Waves')).toBeNull();
  expect(screen.queryByTestId('switch')).toBeNull();
  expect(screen.queryByTestId('wave-p1')).toBeNull();
  expect(screen.getByTestId('wave-r1')).toHaveAttribute('data-pin', 'false');
});
