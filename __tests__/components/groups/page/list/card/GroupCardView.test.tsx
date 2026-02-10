import { render } from '@testing-library/react';
import React from 'react';
import GroupCardView from '@/components/groups/page/list/card/GroupCardView';

const HeaderMock = jest.fn(() => <div data-testid="header" />);
const ContentMock = jest.fn(() => <div data-testid="content" />);

jest.mock('@/components/groups/page/list/card/GroupCardHeader', () => (props: any) => HeaderMock(props));
jest.mock('@/components/groups/page/list/card/GroupCardContent', () => (props: any) => ContentMock(props));

describe('GroupCardView', () => {
  it('renders header and content with props', () => {
    const group: any = { id: 'g' };
    render(
      <GroupCardView group={group} haveActiveGroupVoteAll={false} />
    );
    expect(HeaderMock).toHaveBeenCalledWith(expect.objectContaining({ group }));
    expect(ContentMock).toHaveBeenCalledWith(expect.objectContaining({ group }));
  });
});
