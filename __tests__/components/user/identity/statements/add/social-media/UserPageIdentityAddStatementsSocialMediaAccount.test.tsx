import { render } from '@testing-library/react';
import { act } from '@testing-library/react';
import React from 'react';
import UserPageIdentityAddStatementsSocialMediaAccount from '../../../../../../../components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccount';
import { STATEMENT_TYPE, STATEMENT_GROUP } from '../../../../../../../helpers/Types';

let headerProps: any;
let itemsProps: any;
let formProps: any;

jest.mock('../../../../../../../components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountHeader', () => (props: any) => {
  headerProps = props;
  return <div data-testid="header" />;
});

jest.mock('../../../../../../../components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountItems', () => (props: any) => {
  itemsProps = props;
  return <div data-testid="items" />;
});

jest.mock('../../../../../../../components/user/identity/statements/utils/UserPageIdentityAddStatementsForm', () => (props: any) => {
  formProps = props;
  return <div data-testid="form" />;
});

describe('UserPageIdentityAddStatementsSocialMediaAccount', () => {
  const profile = { id: 'p1' } as any;
  const onClose = jest.fn();

  beforeEach(() => {
    headerProps = undefined;
    itemsProps = undefined;
    formProps = undefined;
  });

  it('passes props and updates type', () => {
    render(<UserPageIdentityAddStatementsSocialMediaAccount profile={profile} onClose={onClose} />);

    expect(headerProps.onClose).toBe(onClose);
    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.X);
    expect(typeof itemsProps.setSocialType).toBe('function');

    expect(formProps.group).toBe(STATEMENT_GROUP.SOCIAL_MEDIA_ACCOUNT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.X);
    expect(formProps.profile).toBe(profile);

    act(() => {
      itemsProps.setSocialType(STATEMENT_TYPE.REDDIT);
    });

    expect(itemsProps.activeType).toBe(STATEMENT_TYPE.REDDIT);
    expect(formProps.activeType).toBe(STATEMENT_TYPE.REDDIT);
  });
});
