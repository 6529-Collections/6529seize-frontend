import { render } from '@testing-library/react';
import React, { createRef } from 'react';
import ClearEditorPlugin, { ClearEditorPluginHandles } from '../../../../../../components/drops/create/lexical/plugins/ClearEditorPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

jest.mock('@lexical/react/LexicalComposerContext');

const clearMock = jest.fn();

jest.mock('lexical', () => ({
  $getRoot: jest.fn(() => ({ clear: clearMock })),
}));

const useCtx = useLexicalComposerContext as jest.Mock;

describe('ClearEditorPlugin', () => {
  it('exposes clearEditorState which clears root', () => {
    const update = jest.fn((fn: any) => fn());
    useCtx.mockReturnValue([{ update }]);
    const ref = createRef<ClearEditorPluginHandles>();
    render(<ClearEditorPlugin ref={ref} />);
    ref.current!.clearEditorState();
    expect(update).toHaveBeenCalled();
    expect(clearMock).toHaveBeenCalled();
  });
});
