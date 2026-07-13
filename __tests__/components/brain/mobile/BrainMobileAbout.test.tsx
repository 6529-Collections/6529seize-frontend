import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainMobileAbout from '@/components/brain/mobile/BrainMobileAbout';
import { useQuery } from '@tanstack/react-query';
import { useLayout } from '@/components/brain/my-stream/layout/LayoutContext';
import { Mode } from '@/components/brain/right-sidebar/BrainRightSidebarTypes';

jest.mock('@/components/brain/right-sidebar/WaveContent', () => ({
  __esModule: true,
  WaveContent: (props: any) => (
    <div
      data-testid="wave-content"
      data-max-visible-tabs={props.maxVisibleTabs}
      data-mode={props.mode}
    >
      <button
        data-testid="toggle-followers"
        onClick={() =>
          props.setMode(
            props.mode === Mode.FOLLOWERS ? Mode.CONTENT : Mode.FOLLOWERS
          )
        }
      >
        toggle followers
      </button>
    </div>
  ),
}));

jest.mock('@tanstack/react-query');
jest.mock('@/components/brain/my-stream/layout/LayoutContext');

const mockUseQuery = useQuery as jest.Mock;
const mockUseLayout = useLayout as jest.Mock;

const wave = { id: '1' } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLayout.mockReturnValue({ mobileAboutViewStyle: {} });
});

test('renders the shared right-panel content with mobile tab overflow', () => {
  mockUseQuery.mockReturnValue({ data: wave });
  render(<BrainMobileAbout activeWaveId="1" />);
  expect(screen.getByTestId('wave-content')).toBeInTheDocument();
  expect(screen.getByTestId('wave-content')).toHaveAttribute(
    'data-max-visible-tabs',
    '3'
  );
});

test('toggles to followers view and back', async () => {
  mockUseQuery.mockReturnValue({ data: wave });
  const user = userEvent.setup();
  render(<BrainMobileAbout activeWaveId="1" />);
  const content = screen.getByTestId('wave-content');
  await user.click(screen.getByTestId('toggle-followers'));
  expect(content).toHaveAttribute('data-mode', Mode.FOLLOWERS);
  await user.click(screen.getByTestId('toggle-followers'));
  expect(content).toHaveAttribute('data-mode', Mode.CONTENT);
});

test('renders nothing when no wave data', () => {
  mockUseQuery.mockReturnValue({ data: undefined });
  const { container } = render(<BrainMobileAbout activeWaveId="1" />);
  expect(container.firstChild?.childNodes.length).toBe(0);
});
