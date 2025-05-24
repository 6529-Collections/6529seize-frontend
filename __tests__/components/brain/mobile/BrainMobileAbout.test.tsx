import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainMobileAbout from '../../../../components/brain/mobile/BrainMobileAbout';
import { useQuery } from '@tanstack/react-query';
import { useLayout } from '../../../../components/brain/my-stream/layout/LayoutContext';

jest.mock('../../../../components/waves/header/WaveHeader', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="header" onClick={props.onFollowersClick}>header</button>,
  WaveHeaderPinnedSide: { LEFT: 'left' }
}));

jest.mock('../../../../components/brain/right-sidebar/BrainRightSidebarContent', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="content">content-{props.wave.id}</div>
}));

jest.mock('../../../../components/brain/right-sidebar/BrainRightSidebarFollowers', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="followers" onClick={props.closeFollowers}>followers-{props.wave.id}</div>
}));

jest.mock('@tanstack/react-query');
jest.mock('../../../../components/brain/my-stream/layout/LayoutContext');

const mockUseQuery = useQuery as jest.Mock;
const mockUseLayout = useLayout as jest.Mock;

const wave = { id: '1' } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLayout.mockReturnValue({ mobileAboutViewStyle: {} });
});

test('renders header and content when wave data available', () => {
  mockUseQuery.mockReturnValue({ data: wave });
  render(<BrainMobileAbout activeWaveId="1" />);
  expect(screen.getByTestId('header')).toBeInTheDocument();
  expect(screen.getByTestId('content')).toHaveTextContent('content-1');
  expect(screen.queryByTestId('followers')).toBeNull();
});

test('toggles to followers view and back', async () => {
  mockUseQuery.mockReturnValue({ data: wave });
  const user = userEvent.setup();
  render(<BrainMobileAbout activeWaveId="1" />);
  await user.click(screen.getByTestId('header'));
  expect(screen.queryByTestId('content')).toBeNull();
  const followers = screen.getByTestId('followers');
  expect(followers).toBeInTheDocument();
  await user.click(followers); // triggers closeFollowers
  expect(screen.getByTestId('content')).toBeInTheDocument();
});

test('renders nothing when no wave data', () => {
  mockUseQuery.mockReturnValue({ data: undefined });
  const { container } = render(<BrainMobileAbout activeWaveId="1" />);
  expect(container.firstChild?.childNodes.length).toBe(0);
});
