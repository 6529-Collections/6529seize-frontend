import { render } from '@testing-library/react';
import AutoFocusPlugin from '../../../../../../components/drops/create/lexical/plugins/AutoFocusPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

jest.mock('@lexical/react/LexicalComposerContext', () => ({ useLexicalComposerContext: jest.fn() }));

test('focuses editor on mount', () => {
  const focus = jest.fn();
  (useLexicalComposerContext as jest.Mock).mockReturnValue([{ focus }]);
  render(<AutoFocusPlugin />);
  expect(focus).toHaveBeenCalled();
});
