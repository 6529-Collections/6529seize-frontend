import { render } from '@testing-library/react';
import React from 'react';
jest.mock("react-use");
import HashtagsTypeaheadMenu from '../../../../../../../components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenu';
import { useKeyPressEvent } from 'react-use';

let keyCb: any;
(useKeyPressEvent as jest.Mock).mockImplementation((_key, cb) => { keyCb = cb; });

const option = { key: 'a', label: 'A' } as any;
const setHighlightedIndex = jest.fn();
const selectOptionAndCleanUp = jest.fn();

let utils: any;
beforeEach(() => {
  utils = render(
    <HashtagsTypeaheadMenu
      selectedIndex={0}
      options={[option]}
      setHighlightedIndex={setHighlightedIndex}
      selectOptionAndCleanUp={selectOptionAndCleanUp}
    />
  );
});

test('selects option on space press', () => {
  keyCb();
  expect(setHighlightedIndex).toHaveBeenCalledWith(0);
  expect(selectOptionAndCleanUp).toHaveBeenCalledWith(option);
});
