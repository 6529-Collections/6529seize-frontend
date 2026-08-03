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

jest.mock('@lexical/react/LexicalTypeaheadMenuPlugin', () => ({
  LexicalTypeaheadMenuPlugin: jest.fn(() => <div data-testid="lexical" />),
  MenuOption: class MockMenuOption {},
  useBasicTypeaheadTriggerMatch: () => () => null,
}));

jest.mock('@/components/drops/create/lexical/plugins/hashtags/HashtagsTypeaheadMenu', () => () => <div data-testid="menu" />);
jest.mock('@/components/drops/create/lexical/nodes/HashtagNode', () => ({
  $createHashtagNode: jest.fn(),
}));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({ 
  isEthereumAddress: jest.fn(() => true),
  __esModule: true
}));

import React from 'react';
import { render } from '@testing-library/react';
import NewHashtagsPlugin, {
  createNftReferenceNode,
  HashtagsTypeaheadOption,
} from '@/components/drops/create/lexical/plugins/hashtags/HashtagsPlugin';
import { getPossibleQueryMatch } from '@/components/drops/create/lexical/plugins/hashtags/getPossibleQueryMatch';

const {
  $createHashtagNode,
} = require('@/components/drops/create/lexical/nodes/HashtagNode');
beforeEach(() => {
  jest.clearAllMocks();
});

test('renders without crashing', () => {
  render(<NewHashtagsPlugin onSelect={jest.fn()} />);
  expect(true).toBe(true);
});

test('getPossibleQueryMatch finds hashtag info', () => {
  const match = getPossibleQueryMatch(' $hello');
  expect(match).toEqual({
    leadOffset: 1,
    matchingString: 'hello',
    replaceableString: '$hello',
  });
});

test('HashtagsTypeaheadOption creates option correctly', () => {
  const option = new HashtagsTypeaheadOption({
    contract: '0x1234567890123456789012345678901234567890',
    tokenId: '1',
    name: 'Test NFT',
    picture: 'test.jpg'
  });

  expect(option.contract).toBe('0x1234567890123456789012345678901234567890');
  expect(option.tokenId).toBe('1');
  expect(option.name).toBe('Test NFT');
  expect(option.picture).toBe('test.jpg');
});

test('creates an editor node containing the selected NFT identity', () => {
  const mentionNode = { select: jest.fn() };
  ($createHashtagNode as jest.Mock).mockReturnValue(mentionNode);

  const option = new HashtagsTypeaheadOption({
    contract: '0x1234567890123456789012345678901234567890',
    tokenId: '42',
    name: 'Test NFT',
    picture: null,
  });
  const result = createNftReferenceNode(option);

  expect($createHashtagNode).toHaveBeenCalledWith('$Test NFT', {
    contract: '0x1234567890123456789012345678901234567890',
    token: '42',
    name: 'Test NFT',
  });
  expect(result).toEqual({
    hashtagNode: mentionNode,
    referencedNft: {
    contract: '0x1234567890123456789012345678901234567890',
    token: '42',
    name: 'Test NFT',
    },
  });
});
