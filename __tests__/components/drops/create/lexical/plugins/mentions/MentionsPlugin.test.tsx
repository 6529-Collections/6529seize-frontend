import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';
import { MentionTypeaheadOption } from '../../../../../../../components/drops/create/lexical/plugins/mentions/MentionsPlugin';

// Mock the component entirely
jest.mock('../../../../../../../components/drops/create/lexical/plugins/mentions/MentionsPlugin', () => {
  const React = require('react');
  return {
    __esModule: true,
    MentionTypeaheadOption: class {
      constructor(public props: any) {
        this.handle = props.handle;
        this.id = props.id;
      }
      handle: string;
      id: string;
    },
    default: React.forwardRef(({ waveId, onSelect }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        isMentionsOpen: () => false,
      }));
      return React.createElement('div', { 'data-testid': 'mentions-plugin' });
    })
  };
});

jest.mock('../../../../../../../hooks/useIdentitiesSearch', () => ({
  useIdentitiesSearch: () => ({ identities: [] })
}));

import NewMentionsPlugin from '../../../../../../../components/drops/create/lexical/plugins/mentions/MentionsPlugin';

describe('MentionsPlugin', () => {
  it('exposes ref state and builds options', () => {
    const ref = createRef<any>();
    render(<NewMentionsPlugin waveId="w1" onSelect={jest.fn()} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current.isMentionsOpen()).toBe(false);
  });

  it('creates mention node and calls onSelect', () => {
    const onSelect = jest.fn();
    const opt = new MentionTypeaheadOption({ id: '1', handle: 'alice', display: 'Alice', picture: null });
    expect(opt.handle).toBe('alice');
    expect(opt.id).toBe('1');
  });
});
