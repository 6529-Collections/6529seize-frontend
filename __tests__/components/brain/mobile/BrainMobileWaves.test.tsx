import { render } from '@testing-library/react';
import BrainMobileWaves from '@/components/brain/mobile/BrainMobileWaves';

let receivedRef: any;

jest.mock('@/components/brain/left-sidebar/waves/BrainLeftSidebarWaves', () => ({
  __esModule: true,
  default: ({ scrollContainerRef }: any) => {
    receivedRef = scrollContainerRef;
    return <div data-testid="waves" />;
  }
}));

jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ mobileWavesViewStyle: { height: '42px' } })
}));

test('applies style and forwards scroll ref', () => {
  const { container } = render(<BrainMobileWaves />);
  expect((container.firstChild as HTMLElement).style.height).toBe('42px');
  expect(receivedRef).toBeDefined();
  expect(receivedRef.current).toBe(container.firstChild);
});
