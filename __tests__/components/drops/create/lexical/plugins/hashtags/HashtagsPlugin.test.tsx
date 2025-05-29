// Mock react-dom modules before any other imports  
jest.mock('react-dom', () => ({
  createPortal: (node: any) => node,
  __esModule: true,
  default: { createPortal: (node: any) => node },
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
  __esModule: true,
}));

const mockEditor = {
  update: jest.fn((fn: any) => fn()),
};

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}));

let pluginProps: any = null;
jest.mock('@lexical/react/LexicalTypeaheadMenuPlugin', () => ({
  LexicalTypeaheadMenuPlugin: require('react').forwardRef((props: any) => {
    pluginProps = props;
    return <div data-testid="lexical" />;
  }),
  MenuOption: class MockMenuOption {},
  useBasicTypeaheadTriggerMatch: () => () => null,
}));

jest.mock('../../../../../../../components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenu', () => () => <div data-testid="menu" />);
jest.mock('../../../../../../../components/drops/create/lexical/nodes/HashtagNode', () => ({
  $createHashtagNode: (text: string) => ({ select: jest.fn(), text }),
}));

jest.mock('../../../../../../../helpers/AllowlistToolHelpers', () => ({ isEthereumAddress: () => true }));

import React from 'react';
import { render } from '@testing-library/react';
import NewHashtagsPlugin, { HashtagsTypeaheadOption } from '../../../../../../../components/drops/create/lexical/plugins/hashtags/HashtagsPlugin';

test('renders without crashing', () => {
  render(<NewHashtagsPlugin onSelect={jest.fn()} />);
  expect(true).toBe(true);
});
