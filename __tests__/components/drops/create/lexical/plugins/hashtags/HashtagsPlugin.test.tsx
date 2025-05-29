// Mock react-dom modules before any other imports  
jest.mock('react-dom', () => ({ 
  createPortal: (node: any) => node,
  __esModule: true,
  default: { createPortal: (node: any) => node }
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
  __esModule: true,
}));

import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import NewHashtagsPlugin, { HashtagsTypeaheadOption } from '../../../../../../../components/drops/create/lexical/plugins/hashtags/HashtagsPlugin';

const mockEditor = {
  update: jest.fn((fn: any) => fn()),
};

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

let pluginProps: any = null;
jest.mock('@lexical/react/LexicalTypeaheadMenuPlugin', () => ({
  LexicalTypeaheadMenuPlugin: React.forwardRef((props: any, ref: any) => {
    pluginProps = props;
    return <div data-testid="lexical" />;
  }),
  MenuOption: class MockMenuOption {},
  useBasicTypeaheadTriggerMatch: () => () => null,
}));

jest.mock('../../../../../../../components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenu', () => () => <div data-testid="menu" />);
jest.mock('../../../../../../../components/drops/create/lexical/nodes/HashtagNode', () => ({
  $createHashtagNode: (text: string) => ({ select: jest.fn(), text })
}));

jest.mock('../../../../../../../helpers/AllowlistToolHelpers', () => ({ isEthereumAddress: () => true }));

test.skip('exposes open state via ref', () => {
  const ref = createRef<any>();
  render(<NewHashtagsPlugin ref={ref} onSelect={jest.fn()} />);
  expect(ref.current).not.toBeNull();
  expect(ref.current.isHashtagsOpen()).toBe(false);
  pluginProps.onOpen();
  expect(ref.current.isHashtagsOpen()).toBe(true);
  pluginProps.onClose();
  expect(ref.current.isHashtagsOpen()).toBe(false);
});

test.skip('calls onSelect when option selected', () => {
  const onSelect = jest.fn();
  render(<NewHashtagsPlugin onSelect={onSelect} />);
  expect(pluginProps).not.toBeNull();
  const option = new HashtagsTypeaheadOption({ contract: 'c', tokenId: '1', name: 'n', picture: null });
  pluginProps.onSelectOption(option, null, jest.fn());
  expect(onSelect).toHaveBeenCalledWith({ contract: 'c', token: '1', name: 'n' });
});
