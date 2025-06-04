import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebarSearchWave from '../../../../../components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWave';

let escapeHandler: (() => void) | undefined;
const clickAwayHandlers: Array<() => void> = [];

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, handler: () => void) => {
    clickAwayHandlers.push(handler);
  },
  useKeyPressEvent: (key: string, handler: () => void) => {
    if (key === 'Escape') {
      escapeHandler = handler;
    }
  },
}));

jest.mock('../../../../../components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWaveDropdown', () => ({
  __esModule: true,
  default: ({ open, searchCriteria, onClose }: any) => (
    <div data-testid="dropdown">
      {open ? `open:${searchCriteria}` : 'closed'}
      <button onClick={onClose}>close</button>
    </div>
  )
}));

describe('BrainLeftSidebarSearchWave', () => {
  beforeEach(() => {
    escapeHandler = undefined;
    clickAwayHandlers.length = 0;
  });

  it('opens dropdown and updates criteria on focus and change', () => {
    render(<BrainLeftSidebarSearchWave listType="waves" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByTestId('dropdown')).toHaveTextContent('open:');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(screen.getByTestId('dropdown')).toHaveTextContent('open:abc');
  });

  it('closes when escape key is pressed', () => {
    render(<BrainLeftSidebarSearchWave listType="waves" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    act(() => {
      escapeHandler && escapeHandler();
    });
    expect(screen.getByTestId('dropdown')).toHaveTextContent('closed');
  });

  it('clears and closes on enter key', () => {
    render(<BrainLeftSidebarSearchWave listType="waves" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(input).toHaveValue('');
    expect(screen.getByTestId('dropdown')).toHaveTextContent('closed');
  });

  it('clears and closes when dropdown calls onClose', () => {
    render(<BrainLeftSidebarSearchWave listType="waves" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'close' }));
    });
    expect(input).toHaveValue('');
    expect(screen.getByTestId('dropdown')).toHaveTextContent('closed');
  });

  it('closes when clicking away', () => {
    render(<BrainLeftSidebarSearchWave listType="waves" />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    act(() => {
      clickAwayHandlers.forEach(fn => fn());
    });
    expect(screen.getByTestId('dropdown')).toHaveTextContent('closed');
  });
});
