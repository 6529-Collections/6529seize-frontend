import React from 'react';
import { render } from '@testing-library/react';

let includeProps: any;
let privateProps: any;

jest.mock('@/components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMe', () => (props: any) => { includeProps = props; return <div data-testid="include" />; });
jest.mock('@/components/groups/page/create/config/include-me-and-private/GroupCreatePrivate', () => (props: any) => { privateProps = props; return <div data-testid="private" />; });

import GroupCreateIncludeMeAndPrivate from '@/components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMeAndPrivate';

describe('GroupCreateIncludeMeAndPrivate', () => {
  it('passes props to child components', () => {
    const setPrivate = jest.fn();
    const setInclude = jest.fn();
    const { container } = render(
      <GroupCreateIncludeMeAndPrivate
        isPrivate={true}
        setIsPrivate={setPrivate}
        iAmIncluded={false}
        setIAmIncluded={setInclude}
      />
    );
    expect(includeProps).toEqual({ iAmIncluded: false, setIAmIncluded: setInclude });
    expect(privateProps).toEqual({ isPrivate: true, setIsPrivate: setPrivate });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveClass('tw-p-3');
  });
});
