import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';
import NewMentionsPlugin, { MentionTypeaheadOption } from '@/components/drops/create/lexical/plugins/mentions/MentionsPlugin';

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [{ update: (fn: any) => fn() }],
}));

let capturedProps: any;
jest.mock('@lexical/react/LexicalTypeaheadMenuPlugin', () => ({
  LexicalTypeaheadMenuPlugin: (props: any) => {
    capturedProps = props;
    return <div data-testid="typeahead" />;
  },
  MenuOption: class {},
  useBasicTypeaheadTriggerMatch: () => jest.fn(),
}));

jest.mock('@/hooks/useIdentitiesSearch', () => ({
  useIdentitiesSearch: jest.fn(),
}));

jest.mock('@/components/drops/create/lexical/nodes/MentionNode', () => ({
  $createMentionNode: jest.fn(() => ({ replace: jest.fn(), select: jest.fn() })),
}));

const { useIdentitiesSearch } = require('@/hooks/useIdentitiesSearch');
const { $createMentionNode } = require('@/components/drops/create/lexical/nodes/MentionNode');

describe('MentionsPlugin', () => {
  it('builds options from identities and exposes open state', () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [
        { id: '1', handle: 'alice', display: 'Alice', pfp: null },
      ],
    });
    const ref = createRef<any>();
    render(<NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={ref} />);
    expect(capturedProps.options).toHaveLength(1);
    expect(capturedProps.options[0]).toBeInstanceOf(MentionTypeaheadOption);

    act(() => {
      capturedProps.onOpen();
    });
    expect(ref.current.isMentionsOpen()).toBe(true);
    act(() => {
      capturedProps.onClose();
    });
    expect(ref.current.isMentionsOpen()).toBe(false);
  });

  it('calls onSelect with mention info', () => {
    (useIdentitiesSearch as jest.Mock).mockReturnValue({
      identities: [{ id: '1', handle: 'alice', display: 'Alice', pfp: null }],
    });
    const onSelect = jest.fn();
    render(<NewMentionsPlugin waveId="w1" onSelect={onSelect} ref={createRef()} />);
    const option = capturedProps.options[0];
    const close = jest.fn();
    act(() => {
      capturedProps.onSelectOption(option, null, close);
    });
    expect($createMentionNode).toHaveBeenCalledWith(`@${option.handle}`);
    expect(onSelect).toHaveBeenCalledWith({
      mentioned_profile_id: option.id,
      handle_in_content: option.handle,
    });
    expect(close).toHaveBeenCalled();
  });
});
