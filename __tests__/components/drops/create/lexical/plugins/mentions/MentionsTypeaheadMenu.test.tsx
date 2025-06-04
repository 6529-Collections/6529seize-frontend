import { render, screen } from '@testing-library/react';

const mockUseKeyPressEvent = jest.fn();
jest.mock('react-use', () => ({ 
  useKeyPressEvent: mockUseKeyPressEvent
}));

import MentionsTypeaheadMenu from 'components/drops/create/lexical/plugins/mentions/MentionsTypeaheadMenu';

const options = [{ key: '1', label: 'one' }];

describe('MentionsTypeaheadMenu', () => {
  it('calls select when space pressed', () => {
    const setHighlightedIndex = jest.fn();
    const selectOptionAndCleanUp = jest.fn();
    mockUseKeyPressEvent.mockImplementation((_key, cb) => { cb(); });
    render(
      <MentionsTypeaheadMenu
        selectedIndex={0}
        options={options as any}
        setHighlightedIndex={setHighlightedIndex}
        selectOptionAndCleanUp={selectOptionAndCleanUp}
      />
    );
    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(selectOptionAndCleanUp).toHaveBeenCalledWith(options[0]);
  });

  it('renders menu with correct classes', () => {
    const { container } = render(
      <MentionsTypeaheadMenu selectedIndex={null} options={options as any} setHighlightedIndex={jest.fn()} selectOptionAndCleanUp={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('tw-absolute');
    expect(container.firstChild).toHaveClass('tw-z-50');
  });
});
