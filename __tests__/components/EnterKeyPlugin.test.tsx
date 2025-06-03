import React from 'react';
import { render } from '@testing-library/react';
import EnterKeyPlugin from '../../components/drops/create/lexical/plugins/enter/EnterKeyPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

const registerMock = jest.fn();
let commandFn: any;

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock('lexical', () => ({
  KEY_ENTER_COMMAND: 'enter',
  COMMAND_PRIORITY_HIGH: 0,
  $createParagraphNode: jest.fn(() => ({ select: jest.fn() })),
  $getSelection: jest.fn(),
  $insertNodes: jest.fn(),
  $isRangeSelection: jest.fn(() => false),
}));

jest.mock('@lexical/list', () => ({
  $isListItemNode: jest.fn(() => false),
  $isListNode: jest.fn(() => false),
}));

jest.mock('@lexical/rich-text', () => ({
  $isHeadingNode: jest.fn(() => false),
}));

jest.mock('../../hooks/isMobileDevice', () => jest.fn(() => false));
jest.mock('../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));

beforeEach(() => {
  registerMock.mockImplementation((_cmd, fn) => {
    commandFn = fn;
    return () => {};
  });
  (useLexicalComposerContext as jest.Mock).mockReturnValue([{ registerCommand: registerMock, update: (fn: any) => fn() }]);
});

describe('EnterKeyPlugin', () => {
  it('returns false when disabled', () => {
    render(<EnterKeyPlugin disabled={true} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />);
    const event = { preventDefault: jest.fn(), shiftKey: false } as any;
    const result = commandFn(event);
    expect(result).toBe(false);
  });

  it('calls handleSubmit on enter', () => {
    const handleSubmit = jest.fn();
    render(<EnterKeyPlugin disabled={false} handleSubmit={handleSubmit} canSubmitWithEnter={() => true} />);
    const event = { preventDefault: jest.fn(), shiftKey: false } as any;
    const result = commandFn(event);
    expect(handleSubmit).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('inserts paragraph on shift+enter', () => {
    const event = { preventDefault: jest.fn(), shiftKey: true } as any;
    render(<EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />);
    commandFn(event);
    const { $createParagraphNode, $insertNodes } = require('lexical');
    expect(event.preventDefault).toHaveBeenCalled();
    expect($createParagraphNode).toHaveBeenCalled();
    expect($insertNodes).toHaveBeenCalled();
  });

  it('returns true without action when mobile', () => {
    const isMobile = require('../../hooks/isMobileDevice') as jest.Mock;
    isMobile.mockReturnValueOnce(true);
    render(<EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />);
    const event = { preventDefault: jest.fn(), shiftKey: false } as any;
    const result = commandFn(event);
    expect(result).toBe(true);
  });

  it('handles heading shift+enter', () => {
    const { $getSelection, $isRangeSelection } = require('lexical');
    const { $isHeadingNode } = require('@lexical/rich-text');
    const node = { getParent: () => null, getTopLevelElement: () => ({}) };
    $getSelection.mockReturnValue({ anchor: { getNode: () => node } });
    $isRangeSelection.mockReturnValue(true);
    $isHeadingNode.mockReturnValue(true);

    render(<EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />);
    const event = { preventDefault: jest.fn(), shiftKey: true } as any;
    const result = commandFn(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
