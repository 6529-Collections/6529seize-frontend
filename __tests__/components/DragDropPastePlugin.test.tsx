import React from 'react';
import { act, render } from '@testing-library/react';
import DragDropPastePlugin from '../../components/drops/create/lexical/plugins/DragDropPastePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

const toastMock = jest.fn();
jest.mock('../../components/auth/Auth', () => ({ useAuth: () => ({ setToast: toastMock }) }));

const update = (fn: any) => fn();
let commandHandler: any;
const editor = { registerCommand: jest.fn((_cmd: any, fn: any) => { commandHandler = fn; return () => {}; }), update } as any;

jest.mock('@lexical/react/LexicalComposerContext', () => ({ useLexicalComposerContext: jest.fn() }));
jest.mock('../../components/drops/create/lexical/nodes/ImageNode', () => ({ $createImageNode: jest.fn(() => ({ getKey: () => '1' })) }));
jest.mock('../../components/waves/create-wave/services/multiPartUpload', () => ({ multiPartUpload: jest.fn(() => Promise.resolve({ url: 'uploaded' })) }));

jest.mock('lexical', () => ({
  $insertNodes: jest.fn(),
  $getNodeByKey: jest.fn(() => ({ replace: jest.fn(), remove: jest.fn() })),
  COMMAND_PRIORITY_LOW: 1,
}));
jest.mock('@lexical/rich-text', () => ({ DRAG_DROP_PASTE: 'PASTE' }));
jest.mock('@lexical/utils', () => ({
  isMimeType: jest.fn(() => true),
  mediaFileReader: jest.fn(() => Promise.resolve([{ file: new File(['a'], 'a.png', { type: 'image/png' }) }])),
}));

const { $insertNodes, $getNodeByKey } = require('lexical');
const { multiPartUpload } = require('../../components/waves/create-wave/services/multiPartUpload');
const { $createImageNode } = require('../../components/drops/create/lexical/nodes/ImageNode');
const { useAuth } = require('../../components/auth/Auth');

describe('DragDropPastePlugin', () => {
  beforeEach(() => {
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
    jest.clearAllMocks();
  });

  it('uploads image on paste', async () => {
    renderPlugin();
    await act(async () => {
      await commandHandler([new File(['a'], 'a.png', { type: 'image/png' })]);
      await Promise.resolve();
    });
    expect(multiPartUpload).toHaveBeenCalled();
    expect($insertNodes).toHaveBeenCalled();
    expect($getNodeByKey).toHaveBeenCalledWith('1');
  });

  it('shows error when file unsupported', async () => {
    const { isMimeType, mediaFileReader } = require('@lexical/utils');
    (mediaFileReader as jest.Mock).mockResolvedValue([]);
    renderPlugin();
    await act(async () => {
      await commandHandler([new File(['a'], 'a.txt', { type: 'text/plain' })]);
      await Promise.resolve();
    });
    expect(toastMock).toHaveBeenCalled();
  });
});

function renderPlugin() {
  return render(<DragDropPastePlugin />);
}
